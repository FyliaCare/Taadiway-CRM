import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create Admin User
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@taadiway.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN',
      phone: '+234-800-123-4567',
      whatsappNumber: '+234-800-123-4567',
      adminProfile: {
        create: {
          position: 'System Administrator',
          canManageClients: true,
          canRecordSales: true,
          canManageInventory: true,
        },
      },
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create Demo Client 1 - Restaurant
  const hashedClientPassword1 = await bcrypt.hash('client123', 10);
  const restaurantClient = await prisma.user.create({
    data: {
      email: 'restaurant@example.com',
      name: 'Tasty Kitchen',
      password: hashedClientPassword1,
      role: 'USER',
      phone: '+234-801-111-2222',
      whatsappNumber: '+234-801-111-2222',
      clientProfile: {
        create: {
          businessName: 'Tasty Kitchen Restaurant',
          businessType: 'Restaurant',
          businessAddress: '123 Food Street, Lagos, Nigeria',
          contactPerson: 'Chef Johnson',
          subscriptionStatus: 'ACTIVE',
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notifyByEmail: true,
          notifyByWhatsApp: true,
          subscription: {
            create: {
              plan: 'STANDARD',
              amount: 25000,
              currency: 'NGN',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              autoRenew: true,
              status: 'ACTIVE',
              lastPaymentDate: new Date(),
              nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              payments: {
                create: {
                  amount: 25000,
                  currency: 'NGN',
                  paymentMethod: 'Bank Transfer',
                  transactionRef: 'TXN-001',
                  status: 'COMPLETED',
                },
              },
            },
          },
        },
      },
    },
    include: {
      clientProfile: true,
    },
  });

  console.log('✅ Created restaurant client:', restaurantClient.email);

  // Create Demo Client 2 - Retail Shop
  const hashedClientPassword2 = await bcrypt.hash('client123', 10);
  const retailClient = await prisma.user.create({
    data: {
      email: 'shop@example.com',
      name: 'Quick Mart',
      password: hashedClientPassword2,
      role: 'USER',
      phone: '+234-802-333-4444',
      whatsappNumber: '+234-802-333-4444',
      clientProfile: {
        create: {
          businessName: 'Quick Mart Convenience Store',
          businessType: 'Retail Shop',
          businessAddress: '456 Shopping Plaza, Abuja, Nigeria',
          contactPerson: 'Mrs. Sarah',
          subscriptionStatus: 'TRIAL',
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
          notifyByEmail: true,
          notifyByWhatsApp: false,
        },
      },
    },
    include: {
      clientProfile: true,
    },
  });

  console.log('✅ Created retail shop client:', retailClient.email);

  // Create Products for Restaurant
  const products = await prisma.product.createMany({
    data: [
      {
        clientProfileId: restaurantClient.clientProfile!.id,
        name: 'Premium Rice (50kg)',
        description: 'High-quality long grain rice',
        sku: 'RICE-50',
        category: 'Grains',
        unitPrice: 25000,
        costPrice: 20000,
        initialStock: 20,
        currentStock: 20,
        reorderLevel: 5,
      },
      {
        clientProfileId: restaurantClient.clientProfile!.id,
        name: 'Vegetable Oil (25L)',
        description: 'Pure vegetable cooking oil',
        sku: 'OIL-25',
        category: 'Cooking Oil',
        unitPrice: 18000,
        costPrice: 15000,
        initialStock: 15,
        currentStock: 15,
        reorderLevel: 3,
      },
      {
        clientProfileId: restaurantClient.clientProfile!.id,
        name: 'Tomato Paste (4kg)',
        description: 'Concentrated tomato paste',
        sku: 'TOMATO-4',
        category: 'Condiments',
        unitPrice: 3500,
        costPrice: 2800,
        initialStock: 30,
        currentStock: 30,
        reorderLevel: 10,
      },
      {
        clientProfileId: restaurantClient.clientProfile!.id,
        name: 'Frozen Chicken (10kg)',
        description: 'Fresh frozen whole chicken',
        sku: 'CHICKEN-10',
        category: 'Protein',
        unitPrice: 12000,
        costPrice: 10000,
        initialStock: 25,
        currentStock: 25,
        reorderLevel: 8,
      },
    ],
  });

  console.log('✅ Created 4 products for restaurant');

  // Get the created products
  const restaurantProducts = await prisma.product.findMany({
    where: { clientProfileId: restaurantClient.clientProfile!.id },
  });

  // Create Products for Retail Shop
  await prisma.product.createMany({
    data: [
      {
        clientProfileId: retailClient.clientProfile!.id,
        name: 'Soft Drinks (Crate)',
        description: 'Assorted soft drinks - 12 bottles',
        sku: 'SODA-CRATE',
        category: 'Beverages',
        unitPrice: 1500,
        costPrice: 1200,
        initialStock: 50,
        currentStock: 50,
        reorderLevel: 15,
      },
      {
        clientProfileId: retailClient.clientProfile!.id,
        name: 'Bottled Water (Carton)',
        description: 'Pure table water - 24 sachets',
        sku: 'WATER-CARTON',
        category: 'Beverages',
        unitPrice: 800,
        costPrice: 600,
        initialStock: 100,
        currentStock: 100,
        reorderLevel: 20,
      },
      {
        clientProfileId: retailClient.clientProfile!.id,
        name: 'Bread Loaf',
        description: 'Fresh sliced bread',
        sku: 'BREAD-1',
        category: 'Bakery',
        unitPrice: 800,
        costPrice: 600,
        initialStock: 40,
        currentStock: 40,
        reorderLevel: 10,
      },
    ],
  });

  console.log('✅ Created 3 products for retail shop');

  // Create a Sample Sale for Restaurant
  const sale1 = await prisma.sale.create({
    data: {
      clientProfileId: restaurantClient.clientProfile!.id,
      saleNumber: 'SALE-001',
      customerName: 'Mr. Adebayo',
      customerPhone: '+234-803-555-6666',
      deliveryAddress: '789 Customer Ave, Lagos',
      totalAmount: 89500,
      status: 'DELIVERED',
      saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      recordedById: adminUser.id,
      items: {
        create: [
          {
            productId: restaurantProducts[0].id, // Rice
            quantity: 2,
            unitPrice: 25000,
            totalPrice: 50000,
          },
          {
            productId: restaurantProducts[1].id, // Oil
            quantity: 1,
            unitPrice: 18000,
            totalPrice: 18000,
          },
          {
            productId: restaurantProducts[2].id, // Tomato
            quantity: 5,
            unitPrice: 3500,
            totalPrice: 17500,
          },
          {
            productId: restaurantProducts[3].id, // Chicken
            quantity: 2,
            unitPrice: 12000,
            totalPrice: 24000,
          },
        ],
      },
    },
  });

  // Update product stock based on sale
  await prisma.product.update({
    where: { id: restaurantProducts[0].id },
    data: { currentStock: 18 },
  });
  await prisma.product.update({
    where: { id: restaurantProducts[1].id },
    data: { currentStock: 14 },
  });
  await prisma.product.update({
    where: { id: restaurantProducts[2].id },
    data: { currentStock: 25 },
  });
  await prisma.product.update({
    where: { id: restaurantProducts[3].id },
    data: { currentStock: 23 },
  });

  // Create inventory logs for the sale
  await prisma.inventoryLog.createMany({
    data: [
      {
        productId: restaurantProducts[0].id,
        type: 'SALE',
        quantity: -2,
        previousStock: 20,
        newStock: 18,
        reason: 'Sale: SALE-001',
        reference: sale1.id,
        updatedById: adminUser.id,
      },
      {
        productId: restaurantProducts[1].id,
        type: 'SALE',
        quantity: -1,
        previousStock: 15,
        newStock: 14,
        reason: 'Sale: SALE-001',
        reference: sale1.id,
        updatedById: adminUser.id,
      },
      {
        productId: restaurantProducts[2].id,
        type: 'SALE',
        quantity: -5,
        previousStock: 30,
        newStock: 25,
        reason: 'Sale: SALE-001',
        reference: sale1.id,
        updatedById: adminUser.id,
      },
      {
        productId: restaurantProducts[3].id,
        type: 'SALE',
        quantity: -2,
        previousStock: 25,
        newStock: 23,
        reason: 'Sale: SALE-001',
        reference: sale1.id,
        updatedById: adminUser.id,
      },
    ],
  });

  console.log('✅ Created sample sale and inventory logs');

  // Create notifications for the sale
  await prisma.notification.createMany({
    data: [
      {
        clientProfileId: restaurantClient.clientProfile!.id,
        userId: restaurantClient.id,
        type: 'SALE_RECORDED',
        title: 'New Sale Recorded',
        message: `Sale SALE-001 has been recorded for ₦89,500. Items: 2x Rice, 1x Oil, 5x Tomato Paste, 2x Chicken. Delivered to Mr. Adebayo.`,
        channels: ['EMAIL', 'WHATSAPP'],
        status: 'SENT',
        saleId: sale1.id,
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created notification for sale');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Demo Accounts:');
  console.log('═══════════════════════════════════════');
  console.log('Admin Account:');
  console.log('  Email: admin@taadiway.com');
  console.log('  Password: admin123');
  console.log('  Role: Super Admin');
  console.log('');
  console.log('Client Account 1 (Restaurant):');
  console.log('  Email: restaurant@example.com');
  console.log('  Password: client123');
  console.log('  Business: Tasty Kitchen Restaurant');
  console.log('  Status: ACTIVE (30 days subscription)');
  console.log('  Products: 4 items');
  console.log('  Sales: 1 completed sale');
  console.log('');
  console.log('Client Account 2 (Retail Shop):');
  console.log('  Email: shop@example.com');
  console.log('  Password: client123');
  console.log('  Business: Quick Mart Convenience Store');
  console.log('  Status: TRIAL (7 days)');
  console.log('  Products: 3 items');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
