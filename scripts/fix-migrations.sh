#!/bin/bash
# Fix Failed Migrations Script
# Use this to resolve failed migrations in production

echo "🔧 Migration Fix Script for Taadiway CRM"
echo "========================================="
echo ""

# Check if this is the right database
echo "Current database from .env:"
npx prisma migrate status

echo ""
echo "⚠️  IMPORTANT: Make sure you're using the correct database URL"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo ""
echo "Step 1: Checking for failed migrations..."
npx prisma migrate status

echo ""
echo "Step 2: Resolving failed migration..."
echo "If migration '20251024185709_taadiway_crm' is in failed state:"
npx prisma migrate resolve --rolled-back "20251024185709_taadiway_crm" || echo "Migration not in failed state or already resolved"

echo ""
echo "Step 3: Deploying all migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migration fix complete!"
echo ""
echo "To verify:"
echo "  npx prisma migrate status"
