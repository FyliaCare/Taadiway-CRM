// Subscription plan constants - separated to avoid circular dependencies

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic Plan',
    amount: 50, // GHS 50/month
    currency: 'GHS',
    interval: 'monthly',
    features: [
      'Up to 50 products',
      'Basic inventory tracking',
      'Sales recording',
      'Email notifications',
      'Basic analytics',
    ],
  },
  STANDARD: {
    name: 'Standard Plan',
    amount: 100, // GHS 100/month
    currency: 'GHS',
    interval: 'monthly',
    features: [
      'Up to 200 products',
      'Advanced inventory tracking',
      'Sales recording & analytics',
      'Email & WhatsApp notifications',
      'Advanced analytics & reports',
      'Low stock alerts',
      'Priority support',
    ],
  },
  PREMIUM: {
    name: 'Premium Plan',
    amount: 200, // GHS 200/month
    currency: 'GHS',
    interval: 'monthly',
    features: [
      'Unlimited products',
      'Full inventory management',
      'Advanced sales analytics',
      'All notification channels',
      'Custom reports',
      'API access',
      'Dedicated account manager',
      '24/7 priority support',
    ],
  },
} as const;

// Payment provider enum
export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  PAYPAL = 'PAYPAL',
}

// Helper to format amount for display
export function formatAmount(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
