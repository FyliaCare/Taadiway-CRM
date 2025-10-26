import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/lib/trpc/trpc";

export const notificationRouter = createTRPCRouter({
  // Get notifications for current user
  getMine: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().optional().default(50),
          unreadOnly: z.boolean().optional().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.unreadOnly && { status: { not: "READ" } }),
        },
        include: {
          sale: true,
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  // Get notifications for a client
  getByClient: protectedProcedure
    .input(z.object({ clientProfileId: z.string(), limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.notification.findMany({
        where: { clientProfileId: input.clientProfileId },
        include: {
          sale: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id },
        data: { status: "READ" },
      });
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });
  }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        status: { not: "READ" },
      },
    });
  }),

  // Send notification (admin only)
  send: adminProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        userId: z.string(),
        type: z.enum([
          "SALE_RECORDED",
          "LOW_STOCK",
          "SUBSCRIPTION_EXPIRING",
          "SUBSCRIPTION_EXPIRED",
          "PAYMENT_RECEIVED",
          "PAYMENT_FAILED",
        ]),
        title: z.string(),
        message: z.string(),
        channels: z.array(z.enum(["EMAIL", "WHATSAPP", "SMS"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.create({
        data: {
          ...input,
          status: "PENDING",
        },
      });
    }),
});

