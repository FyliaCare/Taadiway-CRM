import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/lib/trpc/trpc";

export const saleRouter = createTRPCRouter({
  // Get all sales for a client (with access control)
  getByClient: protectedProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // If user is a client, enforce they can only see their own sales
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own sales");
        }
      }

      return ctx.prisma.sale.findMany({
        where: { clientProfileId: input.clientProfileId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { saleDate: "desc" },
        take: input.limit,
      });
    }),

  // Get single sale
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sale.findUnique({
        where: { id: input.id },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          notifications: true,
        },
      });
    }),

  // Create sale (admin only)
  create: adminProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        deliveryAddress: z.string().optional(),
        saleDate: z.date().optional(),
        deliveryDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use transaction to ensure data consistency
      return await ctx.prisma.$transaction(async (tx) => {
        // Generate sale number
        const count = await tx.sale.count();
        const saleNumber = `SALE-${String(count + 1).padStart(6, "0")}`;

        // Calculate total
        const totalAmount = input.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );

        // Validate stock availability first
        for (const item of input.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`
            );
          }
        }

        // Create sale with items
        const sale = await tx.sale.create({
          data: {
            clientProfileId: input.clientProfileId,
            saleNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            deliveryAddress: input.deliveryAddress,
            totalAmount,
            saleDate: input.saleDate || new Date(),
            deliveryDate: input.deliveryDate,
            notes: input.notes,
            recordedById: ctx.session.user.id,
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            clientProfile: {
              include: {
                user: true,
              },
            },
          },
        });

        // Update product stock and create inventory logs
        for (const item of input.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) continue;

          const newStock = product.currentStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              type: "SALE",
              quantity: -item.quantity,
              previousStock: product.currentStock,
              newStock,
              reason: `Sale: ${saleNumber}`,
              reference: sale.id,
              updatedById: ctx.session.user.id,
            },
          });
        }

        // Create notification for client
        const itemsSummary = sale.items
          .map((item) => `${item.quantity}x ${item.product.name}`)
          .join(", ");

        const channels: ("EMAIL" | "WHATSAPP")[] = [];
        if (sale.clientProfile.notifyByEmail) channels.push("EMAIL");
        if (sale.clientProfile.notifyByWhatsApp) channels.push("WHATSAPP");

        await tx.notification.create({
          data: {
            clientProfileId: input.clientProfileId,
            userId: sale.clientProfile.userId,
            type: "SALE_RECORDED",
            title: "New Sale Recorded",
            message: `Sale ${saleNumber} has been recorded for ?${totalAmount.toLocaleString()}. Items: ${itemsSummary}.${
              input.customerName ? ` Delivered to ${input.customerName}.` : ""
            }`,
            channels: channels,
            saleId: sale.id,
            status: "PENDING",
          },
        });

        return sale;
      });
    }),

  // Update sale status (admin only)
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "DELIVERED", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.sale.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Get sales statistics (with access control)
  getStats: protectedProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // If user is a client, enforce they can only see their own stats
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own statistics");
        }
      }

      const where = {
        clientProfileId: input.clientProfileId,
        ...(input.startDate &&
          input.endDate && {
            saleDate: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      const [totalSales, totalRevenue, recentSales] = await Promise.all([
        ctx.prisma.sale.count({ where }),
        ctx.prisma.sale.aggregate({
          where,
          _sum: { totalAmount: true },
        }),
        ctx.prisma.sale.findMany({
          where,
          orderBy: { saleDate: "desc" },
          take: 5,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
      ]);

      return {
        totalSales,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        recentSales,
      };
    }),
});

