# Billing API Reference

Complete reference for the Taadiway CRM billing system API endpoints.

## Base Information

- **Router**: `billing`
- **Access**: Client-authenticated procedures (requires active clientProfile)
- **Payment Providers**: Paystack (primary), PayPal (alternative)
- **Currency**: GHS (Ghana Cedis) for Paystack, USD for PayPal

---

## Endpoints

### 1. Get Subscription Plans

Get list of all available subscription plans with pricing.

**Endpoint**: `billing.getPlans`

**Type**: `query`

**Authentication**: Client required

**Input**: None

**Output**:
```typescript
Array<{
  name: string;          // Plan name: 'BASIC' | 'STANDARD' | 'PREMIUM'
  displayName: string;   // User-friendly name
  amount: number;        // Price in minor units (pesewas)
  currency: string;      // 'GHS'
  formattedPrice: string; // e.g., "GHS 50.00"
  features: string[];    // List of plan features
  period: string;        // 'monthly'
}>
```

**Example**:
```typescript
const plans = await trpc.billing.getPlans.query();
// [
//   {
//     name: 'BASIC',
//     displayName: 'Basic Plan',
//     amount: 5000,
//     currency: 'GHS',
//     formattedPrice: 'GHS 50.00',
//     features: ['Basic warehouse access', 'Up to 50 products', 'Email support'],
//     period: 'monthly'
//   },
//   ...
// ]
```

---

### 2. Initialize Paystack Payment

Create a Paystack payment transaction and get authorization URL.

**Endpoint**: `billing.initializePaystack`

**Type**: `mutation`

**Authentication**: Client required

**Input**:
```typescript
{
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  email: string; // Customer email for Paystack
}
```

**Output**:
```typescript
{
  authorizationUrl: string;  // Redirect user to this URL
  reference: string;         // Payment reference for verification
}
```

**Flow**:
1. Creates payment record with PENDING status
2. Initializes Paystack transaction
3. Returns authorization URL
4. Redirect user to URL for payment

**Example**:
```typescript
const result = await trpc.billing.initializePaystack.mutate({
  plan: 'BASIC',
  email: 'vendor@example.com',
});

// Redirect user to complete payment
window.location.href = result.authorizationUrl;
```

**Error Handling**:
- Throws if plan is invalid
- Throws if Paystack API fails
- Throws if clientProfile not found

---

### 3. Verify Paystack Payment

Verify a Paystack payment after user returns from payment page.

**Endpoint**: `billing.verifyPaystack`

**Type**: `mutation`

**Authentication**: Client required

**Input**:
```typescript
{
  reference: string; // Payment reference from initializePaystack
}
```

**Output**:
```typescript
{
  success: boolean;
  message: string;
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
  };
}
```

**Flow**:
1. Verifies payment with Paystack API
2. Updates payment record to COMPLETED
3. Creates/updates subscription
4. Updates client profile subscription status
5. Creates success notification

**Example**:
```typescript
// Get reference from URL query params after redirect
const params = new URLSearchParams(window.location.search);
const reference = params.get('reference');

const result = await trpc.billing.verifyPaystack.mutate({ reference });

if (result.success) {
  console.log('Subscription activated:', result.subscription);
}
```

**Error Handling**:
- Throws if reference not found
- Throws if payment not found
- Throws if verification fails
- Throws if payment not successful

---

### 4. Initialize PayPal Payment

Create a PayPal order and get approval URL.

**Endpoint**: `billing.initializePayPal`

**Type**: `mutation`

**Authentication**: Client required

**Input**:
```typescript
{
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
}
```

**Output**:
```typescript
{
  approvalUrl: string;  // Redirect user to this URL
  orderId: string;      // PayPal order ID for capture
}
```

**Flow**:
1. Creates payment record with PENDING status
2. Creates PayPal order with plan amount
3. Returns approval URL
4. Redirect user to URL for payment

**Example**:
```typescript
const result = await trpc.billing.initializePayPal.mutate({
  plan: 'STANDARD',
});

// Redirect user to PayPal
window.location.href = result.approvalUrl;
```

**Notes**:
- Amount automatically converted to USD
- Includes return and cancel URLs
- PayPal orders expire after 3 hours

---

### 5. Capture PayPal Payment

Capture a PayPal payment after user approves.

**Endpoint**: `billing.capturePayPal`

**Type**: `mutation`

**Authentication**: Client required

**Input**:
```typescript
{
  orderId: string; // PayPal order ID from initializePayPal
}
```

**Output**:
```typescript
{
  success: boolean;
  message: string;
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
  };
}
```

**Flow**:
1. Captures PayPal payment
2. Updates payment record to COMPLETED
3. Creates/updates subscription
4. Updates client profile
5. Creates success notification

**Example**:
```typescript
// Get order ID from URL query params after redirect
const params = new URLSearchParams(window.location.search);
const orderId = params.get('token'); // PayPal uses 'token' param

const result = await trpc.billing.capturePayPal.mutate({ orderId });

if (result.success) {
  console.log('PayPal payment captured:', result.subscription);
}
```

---

### 6. Get Payment History

Retrieve paginated payment history for the current vendor.

**Endpoint**: `billing.getPaymentHistory`

**Type**: `query`

**Authentication**: Client required

**Input**:
```typescript
{
  limit?: number;   // Default: 10, Max: 100
  offset?: number;  // Default: 0
}
```

**Output**:
```typescript
{
  payments: Array<{
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    provider: 'PAYSTACK' | 'PAYPAL';
    paymentDate: Date | null;
    createdAt: Date;
  }>;
  total: number;      // Total payment count
  hasMore: boolean;   // More pages available
}
```

**Example**:
```typescript
const history = await trpc.billing.getPaymentHistory.query({
  limit: 20,
  offset: 0,
});

console.log(`Showing ${history.payments.length} of ${history.total}`);
history.payments.forEach(payment => {
  console.log(`${payment.reference}: ${payment.status}`);
});
```

---

### 7. Cancel Subscription

Cancel the current active subscription.

**Endpoint**: `billing.cancelSubscription`

**Type**: `mutation`

**Authentication**: Client required

**Input**: None

**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Flow**:
1. Finds active subscription
2. Updates status to CANCELLED
3. Updates client profile subscription status
4. Creates cancellation notification

**Example**:
```typescript
const result = await trpc.billing.cancelSubscription.mutate();

if (result.success) {
  console.log('Subscription cancelled');
}
```

**Notes**:
- Subscription remains active until end date
- No refunds for partial months
- User can resubscribe anytime

---

### 8. Get Subscription Status

Get current subscription details and remaining time.

**Endpoint**: `billing.getSubscriptionStatus`

**Type**: `query`

**Authentication**: Client required

**Input**: None

**Output**:
```typescript
{
  plan: string | null;           // Current plan name
  status: string | null;         // 'ACTIVE' | 'CANCELLED' | null
  startDate: Date | null;        // Subscription start
  endDate: Date | null;          // Subscription end
  nextPaymentDate: Date | null;  // Next payment due
  daysRemaining: number | null;  // Days until expiry
}
```

**Example**:
```typescript
const status = await trpc.billing.getSubscriptionStatus.query();

if (status.status === 'ACTIVE') {
  console.log(`Plan: ${status.plan}`);
  console.log(`${status.daysRemaining} days remaining`);
} else {
  console.log('No active subscription');
}
```

---

## Webhook Endpoints

These are not tRPC endpoints but Next.js API routes.

### Paystack Webhook

**URL**: `POST /api/webhooks/paystack`

**Headers**:
```
x-paystack-signature: <HMAC signature>
```

**Events Handled**:
- `charge.success` - Payment completed
- `subscription.create` - Subscription created
- `subscription.disable` - Subscription disabled
- `invoice.payment_failed` - Payment failed

**Response**: `{ received: true }`

### PayPal Webhook

**URL**: `POST /api/webhooks/paypal`

**Events Handled**:
- `PAYMENT.CAPTURE.COMPLETED` - Payment captured
- `PAYMENT.CAPTURE.DENIED` - Payment denied
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled

**Response**: `{ received: true }`

---

## Data Models

### Payment Model

```prisma
model Payment {
  id              String   @id @default(cuid())
  clientProfileId String
  subscriptionId  String?
  reference       String   @unique
  amount          Float
  currency        String
  status          PaymentStatus
  provider        PaymentProvider
  paymentDate     DateTime?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
}

enum PaymentProvider {
  PAYSTACK
  PAYPAL
}
```

### Subscription Model

```prisma
model Subscription {
  id              String   @id @default(cuid())
  clientProfileId String   @unique
  plan            String
  amount          Float
  currency        String
  status          SubscriptionStatus
  startDate       DateTime
  endDate         DateTime
  nextPaymentDate DateTime?
  lastPaymentDate DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
}
```

---

## Error Codes

Common error scenarios:

| Error | Code | Description |
|-------|------|-------------|
| Unauthorized | `UNAUTHORIZED` | No client profile found |
| Not Found | `NOT_FOUND` | Payment/subscription not found |
| Bad Request | `BAD_REQUEST` | Invalid input data |
| Payment Failed | `PAYMENT_FAILED` | Payment verification failed |
| Provider Error | `INTERNAL_SERVER_ERROR` | Payment provider API error |

---

## Rate Limits

No specific rate limits currently enforced, but recommended:
- Max 10 payment initializations per hour per client
- Max 100 payment history queries per hour

---

## Testing

### Test Cards (Paystack Sandbox)

| Card Number | Result |
|-------------|--------|
| 4084 0840 8408 4081 | Success |
| 5060 6666 6666 6666 | Declined |

### PayPal Sandbox

Use PayPal sandbox accounts created in Developer Dashboard.

---

## Security

- All endpoints require authentication
- Client procedures enforce organizationId filtering
- Webhook signatures validated before processing
- Payment amounts validated against plan configuration
- Reference/order IDs are unique and unpredictable

---

## Support

For billing issues:
1. Check payment history: `getPaymentHistory`
2. Verify subscription status: `getSubscriptionStatus`
3. Review webhook logs in provider dashboard
4. Contact system administrator

For API integration help, refer to [BILLING-SETUP.md](./BILLING-SETUP.md).
