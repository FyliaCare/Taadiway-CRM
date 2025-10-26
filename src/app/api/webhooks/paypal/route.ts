import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS, formatAmount } from '@/lib/payment-constants';

// Helper function to calculate subscription end date
function calculateSubscriptionEndDate(startDate: Date, plan: string): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription
  return endDate;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('PayPal webhook received:', body.event_type);

    // Handle different event types
    switch (body.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(body.resource);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await handlePaymentFailed(body.resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(body.resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(body.resource);
        break;
        
      default:
        console.log('Unhandled PayPal event:', body.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(resource: any) {
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    if (!orderId) {
      console.log('No order ID found in payment capture');
      return;
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['paypalOrderId'],
          equals: orderId,
        },
      },
    });

    if (!payment) {
      console.log('Payment record not found for order:', orderId);
      return;
    }

    const metadata = payment.metadata as any;
    const plan = metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
        metadata: {
          ...metadata,
          webhookProcessedAt: new Date().toISOString(),
          paypalData: resource,
        },
      },
    });

    // Update subscription
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

    // Get user ID from client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id: metadata.clientProfileId },
    });

    if (clientProfile) {
      // Create notification
      await prisma.notification.create({
        data: {
          clientProfileId: metadata.clientProfileId,
          userId: clientProfile.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'PayPal Payment Received',
          message: `Your PayPal payment of ${formatAmount(selectedPlan.amount, selectedPlan.currency)} has been confirmed. Your subscription is now active.`,
          channels: ['EMAIL'],
          status: 'PENDING',
        },
      });
    }

    console.log('PayPal payment captured:', orderId);
  } catch (error) {
    console.error('Error processing PayPal payment capture:', error);
  }
}

async function handlePaymentFailed(resource: any) {
  console.log('PayPal payment failed:', resource);
  
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    if (orderId) {
      await prisma.payment.updateMany({
        where: {
          metadata: {
            path: ['paypalOrderId'],
            equals: orderId,
          },
        },
        data: { status: 'FAILED' },
      });
    }
  } catch (error) {
    console.error('Error processing PayPal payment failure:', error);
  }
}

async function handleSubscriptionActivated(resource: any) {
  console.log('PayPal subscription activated:', resource);
  // Handle PayPal subscription activation if using PayPal subscriptions
}

async function handleSubscriptionCancelled(resource: any) {
  console.log('PayPal subscription cancelled:', resource);
  // Handle PayPal subscription cancellation
}
