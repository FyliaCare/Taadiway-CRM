import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, clientProcedure } from "@/lib/trpc/trpc";

export const productRouter = createTRPCRouter({
  // Get all products for a client (with validation)
  getByClient: protectedProcedure
    .input(z.object({ clientProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      // If user is a client, enforce they can only see their own products
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own products");
        }
      }

      return ctx.prisma.product.findMany({
        where: { clientProfileId: input.clientProfileId },
        orderBy: { name: "asc" },
      });
    }),

  // Get single product
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
          inventoryLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              updatedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    }),

  // Create product (admin only)
  create: adminProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        unitPrice: z.number().optional(),
        costPrice: z.number().optional(),
        initialStock: z.number().default(0),
        reorderLevel: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use transaction to ensure product and inventory log are created together
      return await ctx.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            ...input,
            currentStock: input.initialStock,
          },
        });

        // Log initial stock
        if (input.initialStock > 0) {
          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              type: "RESTOCK",
              quantity: input.initialStock,
              previousStock: 0,
              newStock: input.initialStock,
              reason: "Initial stock",
              updatedById: ctx.session.user.id,
            },
          });
        }

        return product;
      });
    }),

  // Update product (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        unitPrice: z.number().optional(),
        costPrice: z.number().optional(),
        reorderLevel: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.product.update({
        where: { id },
        data,
      });
    }),

  // Update stock (restock or adjustment) - admin only
  updateStock: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        type: z.enum(["RESTOCK", "ADJUSTMENT", "DAMAGE", "RETURN"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: input.productId },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const newStock = product.currentStock + input.quantity;

        if (newStock < 0) {
          throw new Error("Insufficient stock");
        }

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: input.productId },
          data: { currentStock: newStock },
        });

        // Log the change
        await tx.inventoryLog.create({
          data: {
            productId: input.productId,
            type: input.type,
            quantity: input.quantity,
            previousStock: product.currentStock,
            newStock,
            reason: input.reason,
            updatedById: ctx.session.user.id,
          },
        });

        return updatedProduct;
      });
    }),

  // Get low stock products
  getLowStock: protectedProcedure
    .input(z.object({ clientProfileId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Get all products and filter client-side for low stock
      const products = await ctx.prisma.product.findMany({
        where: {
          ...(input.clientProfileId && {
            clientProfileId: input.clientProfileId,
          }),
          isActive: true,
          reorderLevel: {
            not: null,
          },
        },
        include: {
          clientProfile: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Filter for products where currentStock <= reorderLevel
      return products.filter(
        (product) =>
          product.reorderLevel !== null &&
          product.currentStock <= product.reorderLevel
      );
    }),
});

