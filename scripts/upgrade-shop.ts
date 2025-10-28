import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Upgrading shop client to full access...\n');

    // Find the shop client
    const shopClient = await prisma.user.findUnique({
        where: { email: 'shop@example.com' },
        include: { clientProfile: true },
    });

    if (!shopClient || !shopClient.clientProfile) {
        console.error('❌ Shop client not found!');
        process.exit(1);
    }

    // Update client profile to ACTIVE subscription
    const updatedProfile = await prisma.clientProfile.update({
        where: { id: shopClient.clientProfile.id },
        data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            subscription: {
                upsert: {
                    create: {
                        plan: 'PREMIUM',
                        amount: 50000,
                        currency: 'NGN',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        autoRenew: true,
                        status: 'ACTIVE',
                        lastPaymentDate: new Date(),
                        nextPaymentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        payments: {
                            create: {
                                amount: 50000,
                                currency: 'NGN',
                                paymentMethod: 'Admin Upgrade',
                                transactionRef: `TXN-UPGRADE-${Date.now()}`,
                                status: 'COMPLETED',
                            },
                        },
                    },
                    update: {
                        plan: 'PREMIUM',
                        amount: 50000,
                        status: 'ACTIVE',
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        autoRenew: true,
                        lastPaymentDate: new Date(),
                        nextPaymentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    },
                },
            },
        },
    });

    console.log('✅ Shop client upgraded successfully!\n');
    console.log('📊 Updated Details:');
    console.log('═══════════════════════════════════════');
    console.log('Client: Quick Mart Convenience Store');
    console.log('Email: shop@example.com');
    console.log('Password: client123');
    console.log('');
    console.log('Subscription Status: ACTIVE (was TRIAL)');
    console.log('Plan: PREMIUM');
    console.log('Valid Until:', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString());
    console.log('Auto-Renew: Yes');
    console.log('Amount: ₦50,000/year');
    console.log('═══════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('Error upgrading shop client:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
