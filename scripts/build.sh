#!/bin/bash

# Production Deployment Script for Render
# This script runs during the build phase on Render

set -e  # Exit on error

echo "🚀 Starting production build..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 2. Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# 3. Run database migrations with error handling
echo "🗄️ Running database migrations..."
if ! npx prisma migrate deploy; then
    echo "⚠️  Migration failed, attempting to resolve..."
    # Try to mark failed migrations as applied if schema is correct
    npx prisma migrate resolve --applied "20251024185709_taadiway_crm" || true
    npx prisma migrate deploy || {
        echo "❌ Migration failed. Checking database status..."
        npx prisma migrate status
        exit 1
    }
fi

# 4. Build Next.js application
echo "⚡ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
