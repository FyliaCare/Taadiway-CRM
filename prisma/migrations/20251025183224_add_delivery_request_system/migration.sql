-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYMENT_BEFORE_DELIVERY', 'PAYMENT_ON_DELIVERY', 'BANK_TRANSFER', 'CARD', 'CASH', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('CUSTOMER', 'PRODUCT', 'AMOUNT', 'TIME', 'COMBINED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_DISPATCHED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERY_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_GENERATED';
ALTER TYPE "NotificationType" ADD VALUE 'RECEIPT_GENERATED';

-- AlterTable
ALTER TABLE "AdminProfile" ALTER COLUMN "restrictedToClients" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DeliveryRequest" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "specialInstructions" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliveryProof" TEXT,
    "customerSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRequestItem" (
    "id" TEXT NOT NULL,
    "deliveryRequestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DeliveryRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoApprovalRule" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "ruleType" "RuleType" NOT NULL,
    "customerPhones" TEXT[],
    "productIds" TEXT[],
    "maxAmount" DOUBLE PRECISION,
    "minAmount" DOUBLE PRECISION,
    "allowedDays" TEXT[],
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "saleId" TEXT,
    "deliveryRequestId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "templateId" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "customFields" JSONB,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRequest_requestNumber_key" ON "DeliveryRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "DeliveryRequest_clientProfileId_idx" ON "DeliveryRequest"("clientProfileId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_status_idx" ON "DeliveryRequest"("status");

-- CreateIndex
CREATE INDEX "DeliveryRequest_scheduledDate_idx" ON "DeliveryRequest"("scheduledDate");

-- CreateIndex
CREATE INDEX "DeliveryRequest_requestNumber_idx" ON "DeliveryRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "DeliveryRequestItem_deliveryRequestId_idx" ON "DeliveryRequestItem"("deliveryRequestId");

-- CreateIndex
CREATE INDEX "DeliveryRequestItem_productId_idx" ON "DeliveryRequestItem"("productId");

-- CreateIndex
CREATE INDEX "AutoApprovalRule_clientProfileId_idx" ON "AutoApprovalRule"("clientProfileId");

-- CreateIndex
CREATE INDEX "AutoApprovalRule_isActive_idx" ON "AutoApprovalRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_saleId_key" ON "Invoice"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_clientProfileId_idx" ON "Invoice"("clientProfileId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_invoiceId_idx" ON "Receipt"("invoiceId");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequestItem" ADD CONSTRAINT "DeliveryRequestItem_deliveryRequestId_fkey" FOREIGN KEY ("deliveryRequestId") REFERENCES "DeliveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequestItem" ADD CONSTRAINT "DeliveryRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoApprovalRule" ADD CONSTRAINT "AutoApprovalRule_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_deliveryRequestId_fkey" FOREIGN KEY ("deliveryRequestId") REFERENCES "DeliveryRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
