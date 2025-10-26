import { z } from "zod";
import { createTRPCRouter, protectedProcedure, clientProcedure } from "@/lib/trpc/trpc";
import {
  getPaystackClient,
  getPayPalClient,
  SUBSCRIPTION_PLANS,
  PaymentProvider,
  convertToMinorUnit,
  generatePaymentReference,
  calculateSubscriptionEndDate,
  formatAmount,
} from "@/lib/payment";

export const billingRouter = createTRPCRouter({
  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================
  
  getPlans: protectedProcedure.query(async () => {
    return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      formattedAmount: formatAmount(plan.amount, plan.currency),
    }));
  }),

  // ============================================
  // PAYSTACK PAYMENT INITIALIZATION
  // ============================================
  
  initializePaystack: clientProcedure
    .input(
      z.object({
        plan: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
        include: { user: true, subscription: true },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const selectedPlan = SUBSCRIPTION_PLANS[input.plan];
      const reference = generatePaymentReference('PAYSTACK');
      const amount = convertToMinorUnit(selectedPlan.amount); // Convert to kobo

      try {
        // Get Paystack client
        const paystackClient = getPaystackClient();
        if (!paystackClient) {
          throw new Error('Paystack is not configured');
        }

        // Initialize Paystack transaction
        const response = await paystackClient.transaction.initialize({
          email: input.email,
          amount: amount,
          currency: selectedPlan.currency,
          reference: reference,
          callback_url: `${process.env.NEXTAUTH_URL}/dashboard/billing/verify`,
          metadata: {
            clientProfileId: clientProfile.id,
            userId: ctx.session.user.id,
            plan: input.plan,
            custom_fields: [
              {
                display_name: 'Client Name',
                variable_name: 'client_name',
                value: clientProfile.businessName,
              },
            ],
          },
        });

        // Ensure subscription exists before creating payment
        let subscriptionId = clientProfile.subscription?.id;
        if (!subscriptionId) {
          // Create a temporary subscription record
          const tempSubscription = await ctx.prisma.subscription.create({
            data: {
              clientProfileId: clientProfile.id,
              plan: input.plan,
              amount: selectedPlan.amount,
              currency: selectedPlan.currency,
              startDate: new Date(),
              endDate: new Date(), // Will be updated after payment
              status: 'TRIAL',
            },
          });
          subscriptionId = tempSubscription.id;
        }

        // Create pending payment record
        await ctx.prisma.payment.create({
          data: {
            subscriptionId: subscriptionId,
            amount: selectedPlan.amount,
            currency: selectedPlan.currency,
            paymentMethod: PaymentProvider.PAYSTACK,
            transactionRef: reference,
            status: 'PENDING',
            metadata: {
              plan: input.plan,
              email: input.email,
              paystackRef: response.data.reference,
              clientProfileId: clientProfile.id,
            },
          },
        });

        return {
          success: true,
          authorizationUrl: response.data.authorization_url,
          accessCode: response.data.access_code,
          reference: response.data.reference,
        };
      } catch (error: any) {
        console.error('Paystack initialization error:', error);
        throw new Error(`Failed to initialize payment: ${error.message}`);
      }
    }),

  // Verify Paystack payment
  verifyPaystack: clientProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get Paystack client
        const paystackClient = getPaystackClient();
        if (!paystackClient) {
          throw new Error('Paystack is not configured');
        }

        // Verify transaction with Paystack
        const response = await paystackClient.transaction.verify(input.reference);

        if (response.data.status !== 'success') {
          throw new Error('Payment verification failed');
        }

        const metadata = response.data.metadata;
        const plan = metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
        const selectedPlan = SUBSCRIPTION_PLANS[plan];

        // Update payment record
        const payment = await ctx.prisma.payment.findFirst({
          where: { transactionRef: input.reference },
        });

        if (payment) {
          const existingMetadata = payment.metadata as Record<string, any> | null;
          await ctx.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paymentDate: new Date(),
              metadata: {
                ...(existingMetadata || {}),
                verifiedAt: new Date().toISOString(),
                paystackResponse: response.data,
              },
            },
          });
        }

        // Update or create subscription
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, plan);

        const subscription = await ctx.prisma.subscription.upsert({
          where: { clientProfileId: metadata.clientProfileId },
          create: {
            clientProfileId: metadata.clientProfileId,
            plan: plan,
            amount: selectedPlan.amount,
            currency: selectedPlan.currency,
            startDate,
            endDate,
            nextPaymentDate: endDate,
            lastPaymentDate: startDate,
            status: 'ACTIVE',
          },
          update: {
            plan: plan,
            amount: selectedPlan.amount,
            startDate,
            endDate,
            nextPaymentDate: endDate,
            lastPaymentDate: startDate,
            status: 'ACTIVE',
          },
        });

        // Update client profile
        await ctx.prisma.clientProfile.update({
          where: { id: metadata.clientProfileId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionStart: startDate,
            subscriptionEnd: endDate,
          },
        });

        // Link payment to subscription
        if (payment) {
          await ctx.prisma.payment.update({
            where: { id: payment.id },
            data: { subscriptionId: subscription.id },
          });
        }

        // Create success notification
        await ctx.prisma.notification.create({
          data: {
            clientProfileId: metadata.clientProfileId,
            userId: metadata.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            message: `Your payment of ${formatAmount(selectedPlan.amount, selectedPlan.currency)} for the ${selectedPlan.name} has been received. Your subscription is now active until ${endDate.toLocaleDateString()}.`,
            channels: ['EMAIL'],
            status: 'PENDING',
          },
        });

        return {
          success: true,
          subscription,
          payment,
          message: 'Payment verified successfully',
        };
      } catch (error: any) {
        console.error('Payment verification error:', error);
        
        // Update payment as failed
        await ctx.prisma.payment.updateMany({
          where: { transactionRef: input.reference },
          data: { status: 'FAILED' },
        });

        throw new Error(`Payment verification failed: ${error.message}`);
      }
    }),

  // ============================================
  // PAYPAL PAYMENT INITIALIZATION
  // ============================================
  
  initializePayPal: clientProcedure
    .input(
      z.object({
        plan: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const selectedPlan = SUBSCRIPTION_PLANS[input.plan];
      const reference = generatePaymentReference('PAYPAL');

      try {
        // Get PayPal client and SDK
        const paypalClient = getPayPalClient();
        const paypalSDK = require('@paypal/checkout-server-sdk');
        
        // Create PayPal order
        const request = new paypalSDK.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: reference,
              description: `${selectedPlan.name} - Monthly Subscription`,
              amount: {
                currency_code: selectedPlan.currency,
                value: selectedPlan.amount.toFixed(2),
              },
              custom_id: clientProfile.id,
            },
          ],
          application_context: {
            brand_name: 'Taadiway CRM',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing/paypal/success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing/paypal/cancel`,
          },
        });

        const response = await paypalClient.execute(request);

        // Ensure subscription exists before creating payment
        let subscriptionId = clientProfile.subscription?.id;
        if (!subscriptionId) {
          // Create a temporary subscription record
          const tempSubscription = await ctx.prisma.subscription.create({
            data: {
              clientProfileId: clientProfile.id,
              plan: input.plan,
              amount: selectedPlan.amount,
              currency: selectedPlan.currency,
              startDate: new Date(),
              endDate: new Date(), // Will be updated after payment
              status: 'TRIAL',
            },
          });
          subscriptionId = tempSubscription.id;
        }

        // Create pending payment record
        await ctx.prisma.payment.create({
          data: {
            subscriptionId: subscriptionId,
            amount: selectedPlan.amount,
            currency: selectedPlan.currency,
            paymentMethod: PaymentProvider.PAYPAL,
            transactionRef: reference,
            status: 'PENDING',
            metadata: {
              plan: input.plan,
              paypalOrderId: response.result.id,
              clientProfileId: clientProfile.id,
            },
          },
        });

        // Get approval URL
        const approvalUrl = response.result.links?.find((link: any) => link.rel === 'approve')?.href;

        return {
          success: true,
          orderId: response.result.id,
          approvalUrl: approvalUrl,
          reference: reference,
        };
      } catch (error: any) {
        console.error('PayPal initialization error:', error);
        throw new Error(`Failed to initialize PayPal payment: ${error.message}`);
      }
    }),

  // Capture PayPal payment
  capturePayPal: clientProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get PayPal client and SDK
        const paypalClient = getPayPalClient();
        const paypalSDK = require('@paypal/checkout-server-sdk');
        
        // Capture the order
        const request = new paypalSDK.orders.OrdersCaptureRequest(input.orderId);
        const response = await paypalClient.execute(request);

        if (response.result.status !== 'COMPLETED') {
          throw new Error('Payment capture failed');
        }

        // Find payment record
        const payment = await ctx.prisma.payment.findFirst({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: input.orderId,
            },
          },
        });

        if (!payment) {
          throw new Error('Payment record not found');
        }

        const metadata = payment.metadata as any;
        const plan = metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
        const selectedPlan = SUBSCRIPTION_PLANS[plan];

        // Update payment
        await ctx.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paymentDate: new Date(),
            metadata: {
              ...(metadata || {}),
              capturedAt: new Date().toISOString(),
              paypalResponse: response.result,
            },
          },
        });

        // Update or create subscription
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, plan);

        const subscription = await ctx.prisma.subscription.upsert({
          where: { clientProfileId: metadata.clientProfileId },
          create: {
            clientProfileId: metadata.clientProfileId,
            plan: plan,
            amount: selectedPlan.amount,
            currency: selectedPlan.currency,
            startDate,
            endDate,
            nextPaymentDate: endDate,
            lastPaymentDate: startDate,
            status: 'ACTIVE',
          },
          update: {
            plan: plan,
            amount: selectedPlan.amount,
            startDate,
            endDate,
            nextPaymentDate: endDate,
            lastPaymentDate: startDate,
            status: 'ACTIVE',
          },
        });

        // Update client profile
        await ctx.prisma.clientProfile.update({
          where: { id: metadata.clientProfileId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionStart: startDate,
            subscriptionEnd: endDate,
          },
        });

        // Link payment to subscription
        await ctx.prisma.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: subscription.id },
        });

        // Create success notification
        await ctx.prisma.notification.create({
          data: {
            clientProfileId: metadata.clientProfileId,
            userId: ctx.session.user.id,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            message: `Your PayPal payment of ${formatAmount(selectedPlan.amount, selectedPlan.currency)} for the ${selectedPlan.name} has been received. Your subscription is now active.`,
            channels: ['EMAIL'],
            status: 'PENDING',
          },
        });

        return {
          success: true,
          subscription,
          payment,
          message: 'Payment captured successfully',
        };
      } catch (error: any) {
        console.error('PayPal capture error:', error);
        
        // Update payment as failed
        await ctx.prisma.payment.updateMany({
          where: {
            metadata: {
              path: ['paypalOrderId'],
              equals: input.orderId,
            },
          },
          data: { status: 'FAILED' },
        });

        throw new Error(`Payment capture failed: ${error.message}`);
      }
    }),

  // ============================================
  // PAYMENT HISTORY
  // ============================================
  
  getPaymentHistory: clientProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!clientProfile || !clientProfile.subscription) {
        return { payments: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      }

      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: { subscriptionId: clientProfile.subscription.id },
          skip,
          take: limit,
          orderBy: { paymentDate: 'desc' },
        }),
        ctx.prisma.payment.count({
          where: { subscriptionId: clientProfile.subscription.id },
        }),
      ]);

      return {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================
  
  cancelSubscription: clientProcedure.mutation(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: { subscription: true },
    });

    if (!clientProfile || !clientProfile.subscription) {
      throw new Error('No active subscription found');
    }

    // Update subscription
    await ctx.prisma.subscription.update({
      where: { id: clientProfile.subscription.id },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    // Update client profile
    await ctx.prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });

    // Create notification
    await ctx.prisma.notification.create({
      data: {
        clientProfileId: clientProfile.id,
        userId: ctx.session.user.id,
        type: 'SUBSCRIPTION_EXPIRED',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You can reactivate it anytime.',
        channels: ['EMAIL'],
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Subscription cancelled successfully' };
  }),

  // Get current subscription status
  getSubscriptionStatus: clientProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!clientProfile) {
      return null;
    }

    const subscription = clientProfile.subscription;
    const now = new Date();
    const isExpired = subscription ? subscription.endDate < now : false;
    const daysRemaining = subscription
      ? Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      clientProfile,
      subscription,
      isExpired,
      daysRemaining,
      plan: subscription ? SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS] : null,
    };
  }),
});
