import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS, formatAmount } from '@/lib/payment-constants';
import crypto from 'crypto';

// Helper function to validate Paystack webhook
function validatePaystackWebhook(signature: string, body: string): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex');
  return hash === signature;
}

// Helper function to calculate subscription end date
function calculateSubscriptionEndDate(startDate: Date, plan: string): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription
  return endDate;
}

export async function POST(req: NextRequest) {
  try {
    // Get signature from headers
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Get raw body
    const body = await req.text();
    
    // Validate webhook signature
    if (!validatePaystackWebhook(signature, body)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse event data
    const event = JSON.parse(body);
    
    console.log('Paystack webhook received:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
        
      case 'subscription.create':
        await handleSubscriptionCreate(event.data);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisable(event.data);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data);
        break;
        
      default:
        console.log('Unhandled event type:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(data: any) {
  const { reference, metadata, amount, currency } = data;
  
  try {
    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { transactionRef: reference },
    });

    if (!payment) {
      console.log('Payment record not found for reference:', reference);
      return;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        metadata: {
          ...(metadata || {}),
          webhookProcessedAt: new Date().toISOString(),
          paystackData: data,
        },
      },
    });

    // Update subscription if metadata contains plan info
    if (metadata?.plan && metadata?.clientProfileId) {
      const plan = metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
      const selectedPlan = SUBSCRIPTION_PLANS[plan];
      const startDate = new Date();
      const endDate = calculateSubscriptionEndDate(startDate, plan);

      const subscription = await prisma.subscription.upsert({
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
      await prisma.clientProfile.update({
        where: { id: metadata.clientProfileId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionStart: startDate,
          subscriptionEnd: endDate,
        },
      });

      // Link payment to subscription
      await prisma.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscription.id },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          clientProfileId: metadata.clientProfileId,
          userId: metadata.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: `Your payment of ${formatAmount(selectedPlan.amount, selectedPlan.currency)} has been confirmed. Your subscription is now active.`,
          channels: ['EMAIL'],
          status: 'PENDING',
        },
      });
    }

    console.log('Charge success processed:', reference);
  } catch (error) {
    console.error('Error processing charge success:', error);
  }
}

async function handleSubscriptionCreate(data: any) {
  console.log('Subscription created:', data);
  // Handle subscription creation if using Paystack subscriptions
}

async function handleSubscriptionDisable(data: any) {
  console.log('Subscription disabled:', data);
  
  try {
    // Find and update subscription using stripeSubscriptionId field
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: data.subscription_code,
      },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
        },
      });

      await prisma.clientProfile.update({
        where: { id: subscription.clientProfileId },
        data: { subscriptionStatus: 'CANCELLED' },
      });
    }
  } catch (error) {
    console.error('Error processing subscription disable:', error);
  }
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data);
  
  try {
    // Create notification for payment failure
    const payment = await prisma.payment.findFirst({
      where: { transactionRef: data.reference },
      include: {
        subscription: {
          include: {
            clientProfile: true,
          },
        },
      },
    });

    if (payment && payment.subscription) {
      await prisma.notification.create({
        data: {
          clientProfileId: payment.subscription.clientProfileId,
          userId: payment.subscription.clientProfile.userId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: 'Your recent payment attempt failed. Please try again or contact support.',
          channels: ['EMAIL'],
          status: 'PENDING',
        },
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}
