import { SUBSCRIPTION_PLANS, PaymentProvider, formatAmount } from './payment-constants';

// Re-export constants for backward compatibility
export { SUBSCRIPTION_PLANS, PaymentProvider, formatAmount };

// Paystack Configuration - lazy load to avoid build-time issues
export function getPaystackClient() {
  const paystack = require('paystack-api');
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secretKey) {
    return null;
  }
  return paystack(secretKey);
}

export const paystackConfig = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  callbackUrl: process.env.PAYSTACK_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/webhooks/paystack`,
};

// PayPal Configuration - lazy load to avoid build-time issues
export function getPayPalClient() {
  const paypalSDK = require('@paypal/checkout-server-sdk');
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  
  // Use sandbox for development, live for production
  let environment;
  if (process.env.NODE_ENV === 'production' && process.env.PAYPAL_MODE === 'live') {
    environment = new paypalSDK.core.LiveEnvironment(clientId, clientSecret);
  } else {
    environment = new paypalSDK.core.SandboxEnvironment(clientId, clientSecret);
  }
  
  return new paypalSDK.core.PayPalHttpClient(environment);
}

export const paypalConfig = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'GHS', // Ghana Cedis
  mode: process.env.PAYPAL_MODE || 'sandbox',
};

// Helper to convert amount to smallest currency unit (kobo for Paystack)
export function convertToMinorUnit(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to convert from smallest currency unit
export function convertFromMinorUnit(amount: number): number {
  return amount / 100;
}

// Generate payment reference
export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Calculate subscription end date
export function calculateSubscriptionEndDate(startDate: Date, plan: keyof typeof SUBSCRIPTION_PLANS): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription
  return endDate;
}

// Validate webhook signature (Paystack)
export function validatePaystackWebhook(signature: string, body: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', paystackConfig.secretKey)
    .update(body)
    .digest('hex');
  return hash === signature;
}
