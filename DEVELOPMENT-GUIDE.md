# 🚀 Complete Setup & Development Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [API Documentation](#api-documentation)

---

## Prerequisites

Ensure you have the following installed:
- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual values
```

**Required environment variables:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### 3. Set Up Database
```bash
# Run migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## Database Setup

### PostgreSQL Installation

**Windows:**
```bash
# Download from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taadiway_crm;

# Create user (optional)
CREATE USER taadiway WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taadiway_crm TO taadiway;
```

### Update DATABASE_URL
```env
DATABASE_URL="postgresql://taadiway:your_password@localhost:5432/taadiway_crm?schema=public"
```

---

## Environment Configuration

### Core Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taadiway_crm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-32-char-minimum"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Taadiway CRM"
```

### Optional Services

**Email (Resend):**
```env
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

**Payment - Paystack (Primary):**
```env
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_CALLBACK_URL="http://localhost:3000/api/webhooks/paystack"
```

**Payment - PayPal (Alternative):**
```env
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_MODE="sandbox"
```

**OAuth Providers:**
```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

---

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to DB (no migration)
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (WARNING: deletes all data)

# Utilities
npm run fix-dev          # Fix common dev issues (Prisma/TypeScript)
```

### Demo Accounts (After Seeding)

**Admin Account:**
- Email: `admin@taadiway.com`
- Password: `admin123`
- Role: Super Admin

**Vendor Account 1 (Restaurant):**
- Email: `restaurant@example.com`
- Password: `client123`
- Subscription: STANDARD (30 days)

**Vendor Account 2 (Retail Shop):**
- Email: `shop@example.com`
- Password: `client123`
- Subscription: TRIAL (7 days)

---

## Troubleshooting

### TypeScript Errors After Database Changes

```bash
# Quick fix:
npm run fix-dev

# Or manually:
npx prisma generate
rm -rf .next
# Reload VS Code window: Ctrl+Shift+P → "Reload Window"
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
# Windows:
sc query postgresql-x64-14

# macOS/Linux:
brew services list | grep postgresql
sudo systemctl status postgresql

# Test connection:
psql -U postgres -d taadiway_crm
```

### Port Already in Use

```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Out of Sync

```bash
npx prisma generate
npm run dev
```

### Build Errors

```bash
# Clear all caches:
rm -rf .next
rm -rf node_modules/.cache
npm run db:generate
npm run build
```

---

## API Documentation

### Health Check
```bash
GET /api/health
```
Returns service status and database connectivity.

### Authentication
```bash
POST /api/auth/signin          # Sign in
POST /api/auth/signout         # Sign out
GET /api/auth/session          # Get session
```

### tRPC API Routes
All tRPC endpoints are available at `/api/trpc/*`

**Available Routers:**
- `client` - Client/vendor management
- `product` - Product catalog
- `sale` - Sales recording
- `inventory` - Stock management
- `deliveryRequest` - Delivery requests
- `invoice` - Invoicing & receipts
- `calendar` - Events & scheduling
- `notification` - Notifications
- `subscription` - Billing & subscriptions
- `user` - User management
- `vendor` - Vendor-specific operations
- `reports` - Analytics & reports
- `autoApproval` - Auto-approval rules
- `billing` - Payment processing

**Example tRPC Call:**
```typescript
// Get current client profile
const profile = await trpc.client.getCurrent.useQuery();

// Create a product
const product = await trpc.product.create.useMutation({
  name: "Product Name",
  unitPrice: 1000,
  // ... other fields
});
```

### Webhook Endpoints
```bash
POST /api/webhooks/paystack    # Paystack webhook
POST /api/webhooks/paypal      # PayPal webhook
```

---

## Project Structure

```
taadiway-crm/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Auth pages
│   │   ├── dashboard/        # Dashboard pages
│   │   └── landing/          # Landing page
│   ├── components/           # React components
│   │   ├── ui/              # UI primitives
│   │   ├── dashboard/       # Dashboard components
│   │   └── analytics/       # Charts & analytics
│   ├── lib/                  # Utilities & config
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma client
│   │   ├── env.ts           # Environment validation
│   │   └── trpc/            # tRPC setup
│   ├── server/               # Server-side code
│   │   └── routers/         # tRPC routers
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # Database migrations
├── public/                  # Static assets
└── docs/                   # Documentation
```

---

## Subscription Tiers

| Feature | BASIC | STANDARD | PREMIUM |
|---------|-------|----------|---------|
| Product Management | ✅ | ✅ | ✅ |
| Sales Recording | ✅ | ✅ | ✅ |
| Inventory Tracking | ✅ | ✅ | ✅ |
| Basic Notifications | ✅ | ✅ | ✅ |
| Calendar/Scheduling | ❌ | ✅ | ✅ |
| Auto-Approval Rules | ❌ | 3 rules | Unlimited |
| Reports History | 30 days | 90 days | Unlimited |
| Delivery Requests | ❌ | ✅ | ✅ |
| Invoice Generation | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |

---

## Support & Resources

- **Documentation:** `/docs` folder
- **API Reference:** See `VENDOR-API-QUICK-REF.md`
- **Database Schema:** See `DATABASE.md`
- **Billing Setup:** See `BILLING-SETUP.md`

---

## Production Deployment

### Environment Setup
```env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-new-secret"
```

### Build & Deploy
```bash
# Build
npm run build

# Start
npm run start
```

### Database Migration
```bash
# Run migrations in production
npx prisma migrate deploy
```

---

## License
Proprietary - Taadiway CRM © 2024

---

**Need Help?** Contact support or check the `/docs` folder for detailed documentation.
