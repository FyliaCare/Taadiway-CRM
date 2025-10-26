#!/bin/bash

# Pre-deployment checklist script
# Run this before deploying to production

echo "🔍 Running pre-deployment checks..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "   Create .env from .env.example"
    exit 1
else
    echo "✅ .env file exists"
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL not set in .env"
    exit 1
else
    echo "✅ DATABASE_URL configured"
fi

# Check if NEXTAUTH_SECRET is set
if ! grep -q "NEXTAUTH_SECRET=" .env; then
    echo "⚠️  NEXTAUTH_SECRET not set - generate one!"
    echo "   Run: openssl rand -base64 32"
else
    echo "✅ NEXTAUTH_SECRET configured"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found"
    echo "   Run: npm install"
    exit 1
else
    echo "✅ Dependencies installed"
fi

# Check if Prisma is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "❌ Prisma client not generated"
    echo "   Run: npm run db:generate"
    exit 1
else
    echo "✅ Prisma client generated"
fi

# Run type check
echo ""
echo "🔧 Running TypeScript check..."
npm run type-check
if [ $? -eq 0 ]; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript errors found"
    exit 1
fi

# Run build
echo ""
echo "📦 Testing production build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 All checks passed! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy on Render: https://dashboard.render.com"
echo "3. Set environment variables in Render"
echo "4. Check deployment: https://your-app.onrender.com/api/health"
