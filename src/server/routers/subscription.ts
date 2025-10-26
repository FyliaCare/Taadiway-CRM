import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/lib/trpc/trpc";

export const subscriptionRouter = createTRPCRouter({
  // Get subscription for a client (with access control)
  getByClient: protectedProcedure
    .input(z.object({ clientProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      // If user is client, verify they can only see their own subscription
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own subscription");
        }
      }

      return ctx.prisma.subscription.findUnique({
        where: { clientProfileId: input.clientProfileId },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      });
    }),

  // Create or update subscription (admin only)
  createOrUpdate: adminProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        plan: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
        amount: z.number(),
        duration: z.number().default(30), // days
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + input.duration * 24 * 60 * 60 * 1000
      );

      const subscription = await ctx.prisma.subscription.upsert({
        where: { clientProfileId: input.clientProfileId },
        create: {
          clientProfileId: input.clientProfileId,
          plan: input.plan,
          amount: input.amount,
          startDate,
          endDate,
          nextPaymentDate: endDate,
          status: "ACTIVE",
        },
        update: {
          plan: input.plan,
          amount: input.amount,
          startDate,
          endDate,
          nextPaymentDate: endDate,
          status: "ACTIVE",
        },
      });

      // Update client profile
      await ctx.prisma.clientProfile.update({
        where: { id: input.clientProfileId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionStart: startDate,
          subscriptionEnd: endDate,
        },
      });

      return subscription;
    }),

  // Record payment (admin only)
  recordPayment: adminProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        amount: z.number(),
        paymentMethod: z.string(),
        transactionRef: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.create({
        data: {
          subscriptionId: input.subscriptionId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          transactionRef: input.transactionRef,
          status: "COMPLETED",
        },
      });

      // Update subscription
      const subscription = await ctx.prisma.subscription.update({
        where: { id: input.subscriptionId },
        data: {
          lastPaymentDate: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { payment, subscription };
    }),

  // Check and update expired subscriptions (admin only)
  checkExpired: adminProcedure.mutation(async ({ ctx }) => {
    const now = new Date();

    // Find expired subscriptions
    const expiredSubscriptions = await ctx.prisma.subscription.findMany({
      where: {
        endDate: {
          lt: now,
        },
        status: "ACTIVE",
      },
      include: {
        clientProfile: true,
      },
    });

    // Update them
    for (const sub of expiredSubscriptions) {
      await ctx.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });

      await ctx.prisma.clientProfile.update({
        where: { id: sub.clientProfileId },
        data: { subscriptionStatus: "EXPIRED" },
      });

      // Create notification
      const channels: ("EMAIL" | "WHATSAPP")[] = [];
      if (sub.clientProfile.notifyByEmail) channels.push("EMAIL");
      if (sub.clientProfile.notifyByWhatsApp) channels.push("WHATSAPP");

      await ctx.prisma.notification.create({
        data: {
          clientProfileId: sub.clientProfileId,
          userId: sub.clientProfile.userId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Subscription Expired",
          message: `Your subscription has expired. Please renew to continue accessing your portal.`,
          channels: channels,
          status: "PENDING",
        },
      });
    }

    return { expiredCount: expiredSubscriptions.length };
  }),
});

