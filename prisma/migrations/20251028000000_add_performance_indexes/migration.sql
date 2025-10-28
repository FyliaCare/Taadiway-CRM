-- Add performance indexes for frequently queried fields

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);

-- Product table composite indexes
CREATE INDEX IF NOT EXISTS "Product_clientProfileId_isActive_idx" ON "Product"("clientProfileId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_clientProfileId_category_idx" ON "Product"("clientProfileId", "category");
CREATE INDEX IF NOT EXISTS "Product_sku_idx" ON "Product"("sku") WHERE "sku" IS NOT NULL;

-- Sale table composite indexes
CREATE INDEX IF NOT EXISTS "Sale_clientProfileId_status_saleDate_idx" ON "Sale"("clientProfileId", "status", "saleDate" DESC);
CREATE INDEX IF NOT EXISTS "Sale_saleNumber_idx" ON "Sale"("saleNumber");
CREATE INDEX IF NOT EXISTS "Sale_customerPhone_idx" ON "Sale"("customerPhone") WHERE "customerPhone" IS NOT NULL;

-- Notification table indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_status_idx" ON "Notification"("userId", "status");
CREATE INDEX IF NOT EXISTS "Notification_clientProfileId_createdAt_idx" ON "Notification"("clientProfileId", "createdAt" DESC);

-- Session table index for cleanup
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

-- Inventory log composite index
CREATE INDEX IF NOT EXISTS "InventoryLog_productId_createdAt_idx" ON "InventoryLog"("productId", "createdAt" DESC);

-- SaleItem index for analytics
CREATE INDEX IF NOT EXISTS "SaleItem_productId_createdAt_idx" ON "SaleItem"("productId", "createdAt" DESC);

-- Payment index
CREATE INDEX IF NOT EXISTS "Payment_subscriptionId_status_idx" ON "Payment"("subscriptionId", "status");
