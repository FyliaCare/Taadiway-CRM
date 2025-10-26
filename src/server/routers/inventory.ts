import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/lib/trpc/trpc";

export const inventoryRouter = createTRPCRouter({
  // Get inventory logs for a product
  getByProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access to product
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: { clientProfile: true },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // If user is client, verify they own this product
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || product.clientProfileId !== clientProfile.id) {
          throw new Error("Access denied: You can only view inventory for your own products");
        }
      }

      return ctx.prisma.inventoryLog.findMany({
        where: { productId: input.productId },
        include: {
          product: true,
          updatedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get inventory logs for a client (with access control)
  getByClient: protectedProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      // If user is client, verify they can only see their own inventory
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own inventory");
        }
      }

      return ctx.prisma.inventoryLog.findMany({
        where: {
          product: {
            clientProfileId: input.clientProfileId,
          },
        },
        include: {
          product: true,
          updatedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get inventory summary for a client (with access control)
  getSummary: protectedProcedure
    .input(z.object({ clientProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      // If user is client, verify they can only see their own summary
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own inventory summary");
        }
      }

      const products = await ctx.prisma.product.findMany({
        where: {
          clientProfileId: input.clientProfileId,
          isActive: true,
        },
      });

      const totalProducts = products.length;
      const totalStock = products.reduce(
        (sum, p) => sum + p.currentStock,
        0
      );
      const lowStockProducts = products.filter(
        (p) => p.reorderLevel && p.currentStock <= p.reorderLevel
      );
      const outOfStockProducts = products.filter((p) => p.currentStock === 0);

      const totalValue = products.reduce(
        (sum, p) => sum + p.currentStock * (p.unitPrice || 0),
        0
      );

      return {
        totalProducts,
        totalStock,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalValue,
        lowStockProducts,
        outOfStockProducts,
      };
    }),
});

