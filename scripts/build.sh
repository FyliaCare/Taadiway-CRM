#!/bin/bash

# Production Deployment Script for Render
# This script runs during the build phase on Render

set -e  # Exit on error

echo "🚀 Starting production build..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# 2. Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# 3. Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# 4. Build Next.js application
echo "⚡ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
