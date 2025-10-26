# Advanced Client/Vendor Portal - Feature Requirements

## 🎯 Core Philosophy
The vendor portal should be **premium and advanced** since vendors are paying subscription fees. Each subscription tier (BASIC, STANDARD, PREMIUM) unlocks specific features.

---

## 📋 NEW FEATURES TO IMPLEMENT

### 1. **Sale Authorization & Delivery Workflow**
**Current Gap**: Sales are recorded by admin, not initiated by vendors

**New Flow**:
1. **Vendor Creates Delivery Request**
   - Select products and quantities from their inventory
   - Specify customer details (name, phone, address)
   - Choose payment method:
     - ✅ Payment Before Delivery (PBD) - Customer already paid vendor
     - ✅ Payment On Delivery (POD) - Customer will pay on delivery
   - Set delivery date/time preference
   - Add special delivery instructions

2. **Request Goes to Taadiway Admin**
   - Shows as notification in admin dashboard
   - Admin reviews request (product availability, delivery logistics)
   - Admin can:
     - ✅ **Approve** - Adds to delivery queue
     - ❌ **Reject** - Sends reason back to vendor
     - 🔄 **Request Changes** - Ask vendor to modify

3. **Delivery Execution**
   - Approved requests appear in admin's delivery schedule
   - Admin assigns delivery personnel
   - Real-time status updates:
     - PENDING_APPROVAL → APPROVED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
   - Vendor sees status in their dashboard

4. **Completion & Payment**
   - If POD: Admin confirms payment collection
   - If PBD: Auto-mark as paid
   - Inventory automatically deducted
   - Invoice/Receipt generated

---

### 2. **Invoice & Receipt Generation**
**Features**:
- **Auto-generate professional invoices** for each sale
- **Download as PDF** with vendor branding
- **Email directly to customer** from portal
- **Receipt after delivery** confirmation
- **Customizable templates** (PREMIUM tier)
- **Include**:
  - Vendor business name and address
  - Customer details
  - Itemized products with prices
  - Tax calculations (VAT/GST)
  - Payment status
  - QR code for verification
  - Terms and conditions

---

### 3. **Automated Sale Authorization**
**Use Case**: Vendor wants certain products to auto-approve for trusted customers or specific conditions

**Features**:
- **Auto-Approval Rules**:
  - By customer (whitelist trusted customers)
  - By product (certain products always auto-approve)
  - By amount threshold (orders under ₦50,000 auto-approve)
  - By time window (auto-approve during business hours)
  
- **Smart Scheduling**:
  - Pre-schedule recurring deliveries
  - Weekly/Monthly standing orders
  - Subscription-based deliveries

- **Business Hours Settings**:
  - Set operational hours
  - Auto-reject requests outside hours
  - Holiday calendar integration

---

### 4. **Advanced Reports & Analytics**
**Categories**:

**Sales Reports**:
- Sales by period (daily, weekly, monthly, yearly, custom range)
- Sales by product
- Sales by customer
- Payment method breakdown (POD vs PBD)
- Revenue trends with graphs
- Profit margins per product
- Export to Excel/PDF

**Inventory Reports**:
- Stock movement history
- Reorder predictions based on sales velocity
- Expired/damaged goods tracking
- Stock value reports

**Customer Reports**:
- Top customers by revenue
- Customer purchase frequency
- Customer payment reliability (POD success rate)
- Customer segmentation

**Delivery Reports**:
- Delivery performance (on-time %)
- Failed delivery analysis
- Delivery costs vs revenue
- Geographic delivery heatmap

---

### 5. **Integrated Calendar & Scheduling**
**Features**:

**Vendor Calendar**:
- Visual calendar view of all scheduled deliveries
- Drag-and-drop to reschedule
- Color coding by status:
  - 🟡 Pending approval
  - 🟢 Approved/Scheduled
  - 🔵 Out for delivery
  - ✅ Completed
  - 🔴 Failed/Cancelled

**Admin Calendar Sync**:
- Vendor's scheduled deliveries appear in admin calendar
- Admin gets **notification request** for each new schedule
- Admin approval adds to master delivery calendar
- Conflicts highlighted (same area, same time slot)

**Calendar Features**:
- Set delivery time slots (morning, afternoon, evening)
- Recurring delivery schedules
- Holiday blocking
- Delivery capacity management
- SMS/Email reminders to customers

---

## 🎁 SUBSCRIPTION TIER FEATURE GATING

### **BASIC Plan (GHS 50/month)**
✅ **Included**:
- Up to 50 products
- Basic delivery requests (manual approval only)
- Simple invoice generation (standard template)
- View sales history (last 30 days)
- Email notifications
- Basic inventory tracking
- Standard reports (PDF export only)

❌ **Not Included**:
- Auto-approval rules
- Advanced analytics
- Custom invoice templates
- Calendar scheduling
- WhatsApp notifications
- Excel exports

---

### **STANDARD Plan (GHS 100/month)**
✅ **Everything in BASIC, plus**:
- Up to 200 products
- **Auto-approval rules** (3 rules max)
- **Calendar scheduling** with admin sync
- Advanced sales analytics with graphs
- Custom invoice templates (3 templates)
- Email & **WhatsApp notifications**
- Customer management (save customer profiles)
- Delivery performance tracking
- Excel & PDF report exports
- 90-day sales history

❌ **Not Included**:
- Unlimited auto-approval rules
- API access
- Dedicated account manager
- Custom branding

---

### **PREMIUM Plan (GHS 200/month)**
✅ **Everything in STANDARD, plus**:
- **Unlimited products**
- **Unlimited auto-approval rules**
- Full calendar integration with Google Calendar
- AI-powered sales predictions
- Fully customizable invoice/receipt templates
- Multi-currency support
- **Advanced customer segmentation**
- Loyalty program integration
- SMS notifications
- Priority delivery scheduling
- **API access** for integrations
- Custom reports builder
- Unlimited history access
- **Dedicated account manager**
- **24/7 priority support**
- White-label branding option

---

## 🛠️ TECHNICAL IMPLEMENTATION PLAN

### Phase 1: Database Schema Updates
```prisma
// Add to existing schema

model DeliveryRequest {
  id                String   @id @default(cuid())
  clientProfileId   String
  requestNumber     String   @unique
  customerName      String
  customerPhone     String
  customerEmail     String?
  deliveryAddress   String   @db.Text
  paymentMethod     PaymentMethod
  paymentStatus     PaymentStatus
  scheduledDate     DateTime?
  preferredTime     String?  // "morning", "afternoon", "evening"
  specialInstructions String? @db.Text
  status            DeliveryStatus @default(PENDING_APPROVAL)
  totalAmount       Float
  
  // Admin handling
  reviewedById      String?
  reviewedAt        DateTime?
  rejectionReason   String?
  approvedAt        DateTime?
  assignedTo        String?
  
  // Delivery tracking
  dispatchedAt      DateTime?
  deliveredAt       DateTime?
  deliveryProof     String?  // Photo URL
  customerSignature String?  // Signature URL
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  clientProfile     ClientProfile @relation(fields: [clientProfileId], references: [id])
  items             DeliveryRequestItem[]
  reviewedBy        User?     @relation("ReviewedBy", fields: [reviewedById], references: [id])
  assignedToUser    User?     @relation("AssignedTo", fields: [assignedTo], references: [id])
  
  @@index([clientProfileId])
  @@index([status])
  @@index([scheduledDate])
}

model DeliveryRequestItem {
  id                  String   @id @default(cuid())
  deliveryRequestId   String
  productId           String
  quantity            Int
  unitPrice           Float
  totalPrice          Float
  
  deliveryRequest     DeliveryRequest @relation(fields: [deliveryRequestId], references: [id], onDelete: Cascade)
  product             Product @relation(fields: [productId], references: [id])
  
  @@index([deliveryRequestId])
}

model AutoApprovalRule {
  id                String   @id @default(cuid())
  clientProfileId   String
  name              String
  isActive          Boolean  @default(true)
  priority          Int      @default(0)
  
  // Rule conditions
  ruleType          RuleType // CUSTOMER, PRODUCT, AMOUNT, TIME
  customerPhone     String?  // For customer whitelist
  productIds        String[] // For product whitelist
  maxAmount         Float?   // Auto-approve if total <= this
  minAmount         Float?   // Auto-approve if total >= this
  
  // Time conditions
  allowedDays       String[] // ["MON", "TUE", "WED"]
  startTime         String?  // "09:00"
  endTime           String?  // "17:00"
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  clientProfile     ClientProfile @relation(fields: [clientProfileId], references: [id], onDelete: Cascade)
  
  @@index([clientProfileId])
  @@index([isActive])
}

model Invoice {
  id                String   @id @default(cuid())
  clientProfileId   String
  saleId            String?  @unique
  deliveryRequestId String?  @unique
  invoiceNumber     String   @unique
  
  customerName      String
  customerEmail     String?
  customerPhone     String
  customerAddress   String?  @db.Text
  
  items             Json     // Detailed line items
  subtotal          Float
  taxAmount         Float
  discount          Float    @default(0)
  totalAmount       Float
  
  status            InvoiceStatus @default(DRAFT)
  dueDate           DateTime?
  paidAt            DateTime?
  
  // Template & branding
  templateId        String?
  logoUrl           String?
  brandColor        String?
  
  // Files
  pdfUrl            String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  clientProfile     ClientProfile @relation(fields: [clientProfileId], references: [id])
  sale              Sale?     @relation(fields: [saleId], references: [id])
  deliveryRequest   DeliveryRequest? @relation(fields: [deliveryRequestId], references: [id])
  
  @@index([clientProfileId])
  @@index([status])
}

model Receipt {
  id              String   @id @default(cuid())
  invoiceId       String
  receiptNumber   String   @unique
  amountPaid      Float
  paymentMethod   String
  pdfUrl          String?
  
  createdAt       DateTime @default(now())
  
  invoice         Invoice @relation(fields: [invoiceId], references: [id])
  
  @@index([invoiceId])
}

enum PaymentMethod {
  PAYMENT_BEFORE_DELIVERY
  PAYMENT_ON_DELIVERY
  BANK_TRANSFER
  CARD
  CASH
  MOBILE_MONEY
}

enum DeliveryStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SCHEDULED
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
  CANCELLED
}

enum RuleType {
  CUSTOMER
  PRODUCT
  AMOUNT
  TIME
  COMBINED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

### Phase 2: API Endpoints (tRPC Routers)
Create new routers:
- `deliveryRequest.ts` - Vendor creates/manages delivery requests
- `autoApproval.ts` - Manage auto-approval rules
- `invoice.ts` - Generate invoices/receipts
- `reports.ts` - Advanced analytics and reporting
- `calendar.ts` - Scheduling and calendar management

### Phase 3: UI Components
Create premium dashboard sections:
- **Delivery Requests Page** (`/dashboard/delivery-requests`)
- **Calendar View** (`/dashboard/calendar`)
- **Reports Hub** (`/dashboard/reports`)
- **Invoice Generator** (`/dashboard/invoices`)
- **Auto-Approval Settings** (`/dashboard/settings/auto-approval`)

### Phase 4: Feature Gating Middleware
```typescript
// Check subscription tier before allowing access
function checkFeatureAccess(feature: string, userPlan: string) {
  const featureMatrix = {
    AUTO_APPROVAL: ['STANDARD', 'PREMIUM'],
    CALENDAR_SCHEDULING: ['STANDARD', 'PREMIUM'],
    ADVANCED_REPORTS: ['STANDARD', 'PREMIUM'],
    CUSTOM_INVOICES: ['PREMIUM'],
    API_ACCESS: ['PREMIUM'],
  };
  
  return featureMatrix[feature]?.includes(userPlan);
}
```

---

## 📱 NEXT STEPS

Should I proceed with implementation? I'll build this in phases:

1. ✅ **Phase 1**: Delivery Request System (vendor initiates, admin approves)
2. ✅ **Phase 2**: Invoice & Receipt Generation
3. ✅ **Phase 3**: Auto-Approval Rules
4. ✅ **Phase 4**: Calendar & Scheduling
5. ✅ **Phase 5**: Advanced Reports
6. ✅ **Phase 6**: Feature Gating by Subscription Tier

Let me know if you want me to start building these features now! 🚀
