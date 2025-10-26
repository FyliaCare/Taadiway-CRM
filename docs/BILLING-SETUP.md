# Billing System - Setup & Integration Guide

## Overview

Taadiway CRM uses a dual payment provider system for vendor subscriptions:
- **Paystack** (Primary) - Ghana-focused, supports GHS payments
- **PayPal** (Alternative) - International payments

## Subscription Plans

| Plan | Monthly Price | Features |
|------|--------------|----------|
| BASIC | GHS 50 | Basic warehouse access, up to 50 products |
| STANDARD | GHS 100 | Standard features, up to 200 products, analytics |
| PREMIUM | GHS 200 | Premium features, unlimited products, advanced analytics, priority support |

## Prerequisites

### 1. Paystack Setup

1. **Create Paystack Account**
   - Visit [paystack.com](https://paystack.com)
   - Register for a business account
   - Complete KYC verification

2. **Get API Keys**
   - Navigate to Settings → API Keys & Webhooks
   - Copy your **Secret Key** (starts with `sk_`)
   - Copy your **Public Key** (starts with `pk_`)

3. **Set Up Webhook**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
   - Copy the webhook secret
   - Enable events:
     - `charge.success`
     - `subscription.create`
     - `subscription.disable`
     - `invoice.payment_failed`

### 2. PayPal Setup

1. **Create PayPal Developer Account**
   - Visit [developer.paypal.com](https://developer.paypal.com)
   - Sign in or create account
   - Go to Dashboard

2. **Create App**
   - Click "Create App"
   - Name your app (e.g., "Taadiway CRM")
   - Select app type: Merchant
   - Copy **Client ID** and **Secret**

3. **Configure Webhooks**
   - Go to your app settings
   - Navigate to "Webhooks"
   - Add webhook URL: `https://yourdomain.com/api/webhooks/paypal`
   - Subscribe to events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`

## Environment Configuration

Add the following to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxx # Your Paystack secret key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx # Your Paystack public key
PAYSTACK_CALLBACK_URL=https://yourdomain.com/dashboard/billing/verify

# PayPal Configuration
PAYPAL_CLIENT_ID=xxxxx # Your PayPal client ID
PAYPAL_CLIENT_SECRET=xxxxx # Your PayPal secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx # Same as PAYPAL_CLIENT_ID (for client-side)
PAYPAL_MODE=sandbox # Use 'sandbox' for testing, 'live' for production
PAYPAL_WEBHOOK_ID=xxxxx # Your PayPal webhook ID
```

## Testing Payment Integration

### Paystack Test Cards

Use these test cards in sandbox mode:

| Card Number | Type | Result |
|-------------|------|--------|
| 4084 0840 8408 4081 | Success | Payment succeeds |
| 5060 6666 6666 6666 | Declined | Payment fails |
| 4084 0840 8408 4081 | OTP | Requires 123456 OTP |

### PayPal Sandbox Testing

1. **Create Sandbox Accounts**
   - Go to Sandbox → Accounts
   - Create a "Business" account (merchant)
   - Create a "Personal" account (buyer)

2. **Use Test Credentials**
   - Use the personal account email and auto-generated password
   - Complete checkout flow in sandbox mode

3. **Verify Webhook Delivery**
   - Check PayPal Developer Dashboard → Webhooks
   - View webhook events and retry if needed

## Implementation Guide

### Backend Flow

1. **Initialize Payment** (User selects plan)
```typescript
// For Paystack
const result = await trpc.billing.initializePaystack.mutate({
  plan: 'BASIC',
  email: 'vendor@example.com',
});
// Redirect to: result.authorizationUrl

// For PayPal
const result = await trpc.billing.initializePayPal.mutate({
  plan: 'BASIC',
});
// Redirect to: result.approvalUrl
```

2. **Verify Payment** (After redirect back)
```typescript
// For Paystack
const result = await trpc.billing.verifyPaystack.mutate({
  reference: 'ref_xxxxx',
});

// For PayPal
const result = await trpc.billing.capturePayPal.mutate({
  orderId: 'ORDER_ID',
});
```

3. **Webhook Processing**
   - Paystack: Validates HMAC signature, processes events
   - PayPal: Validates webhook authenticity, processes events
   - Auto-activates subscriptions on successful payment

### Frontend Integration

Example payment flow component:

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

export function SubscriptionCheckout({ plan }: { plan: string }) {
  const [provider, setProvider] = useState<'paystack' | 'paypal'>('paystack');
  const initializePaystack = trpc.billing.initializePaystack.useMutation();
  const initializePayPal = trpc.billing.initializePayPal.useMutation();

  const handlePayment = async () => {
    if (provider === 'paystack') {
      const result = await initializePaystack.mutateAsync({ 
        plan, 
        email: userEmail 
      });
      window.location.href = result.authorizationUrl;
    } else {
      const result = await initializePayPal.mutateAsync({ plan });
      window.location.href = result.approvalUrl;
    }
  };

  return (
    <div>
      <select onChange={(e) => setProvider(e.target.value as any)}>
        <option value="paystack">Paystack (GHS)</option>
        <option value="paypal">PayPal (USD)</option>
      </select>
      <button onClick={handlePayment}>Subscribe</button>
    </div>
  );
}
```

## API Endpoints

### Available tRPC Procedures

All endpoints are under `billing.*`:

- `getPlans` - List all subscription plans
- `initializePaystack` - Start Paystack payment
- `verifyPaystack` - Verify Paystack transaction
- `initializePayPal` - Create PayPal order
- `capturePayPal` - Capture PayPal payment
- `getPaymentHistory` - Get payment records (paginated)
- `cancelSubscription` - Cancel active subscription
- `getSubscriptionStatus` - Get current subscription info

See [BILLING-API.md](./BILLING-API.md) for detailed API reference.

## Webhook Security

### Paystack Webhook Validation

```typescript
import crypto from 'crypto';

function validatePaystackWebhook(payload: string, signature: string) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex');
  return hash === signature;
}
```

### PayPal Webhook Validation

PayPal webhooks are validated using the webhook ID and PayPal SDK. Our webhook handler includes automatic validation.

## Subscription Lifecycle

1. **Initialization**
   - User selects plan
   - Payment initialized with provider
   - Payment record created with PENDING status

2. **Payment**
   - User completes payment on provider's platform
   - User redirected back to callback URL

3. **Verification**
   - Frontend calls verify endpoint
   - Backend confirms payment with provider
   - Subscription activated if successful

4. **Webhook Confirmation**
   - Provider sends webhook event
   - Backend validates and processes
   - Subscription status updated
   - Notification sent to user

5. **Renewal/Cancellation**
   - User can cancel anytime
   - Subscription remains active until end date
   - Auto-renewal can be implemented with provider's subscription API

## Monitoring & Debugging

### Check Payment Status

```typescript
const status = await trpc.billing.getSubscriptionStatus.query();
console.log(status); // { plan, status, daysRemaining, nextPayment }
```

### View Payment History

```typescript
const history = await trpc.billing.getPaymentHistory.query({
  limit: 10,
  offset: 0,
});
```

### Debug Webhooks

1. **Paystack**
   - View webhook logs in Paystack dashboard
   - Retry failed webhooks manually
   - Check signature validation

2. **PayPal**
   - View webhook events in Developer Dashboard
   - Resend webhook events for testing
   - Check webhook ID configuration

## Going Live

### Checklist

- [ ] Switch Paystack to live mode (use `sk_live_` keys)
- [ ] Switch PayPal to live mode (`PAYPAL_MODE=live`)
- [ ] Update webhook URLs to production domain
- [ ] Test live payment with small amount
- [ ] Verify webhook delivery in production
- [ ] Update callback URLs to production
- [ ] Enable monitoring/alerting for failed payments
- [ ] Set up automatic reconciliation

### Production Environment Variables

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_CALLBACK_URL=https://taadiway.com/dashboard/billing/verify

PAYPAL_CLIENT_ID=live_client_id
PAYPAL_CLIENT_SECRET=live_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=live_client_id
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=live_webhook_id
```

## Troubleshooting

### Common Issues

**Issue**: Webhook not received
- Verify webhook URL is publicly accessible
- Check webhook event subscriptions
- Ensure HTTPS is enabled (required by providers)

**Issue**: Payment verification fails
- Check API keys are correct
- Verify reference/order ID matches
- Check payment actually succeeded on provider's dashboard

**Issue**: Subscription not activated
- Check webhook handler logs
- Verify payment record exists
- Ensure clientProfileId is correct

**Issue**: PayPal deprecated SDK warning
- Currently using `@paypal/checkout-server-sdk` (deprecated)
- Consider migrating to `@paypal/paypal-server-sdk` in future
- Current SDK still functional

## Support Resources

- **Paystack**: [docs.paystack.com](https://docs.paystack.com)
- **PayPal**: [developer.paypal.com/docs](https://developer.paypal.com/docs)
- **Taadiway Support**: Contact your system administrator
