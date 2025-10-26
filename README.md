# Taadiway CRM

A comprehensive, full-stack SaaS CRM (Customer Relationship Management) system built with modern web technologies.

## 🚀 Features

### Core CRM Functionality
- **Contact Management** - Track and manage customer contacts with detailed profiles
- **Company Management** - Organize companies with industry, size, and revenue tracking
- **Deal Pipeline** - Visual sales pipeline with customizable stages
- **Task Management** - Create, assign, and track tasks with priorities
- **Activity Timeline** - Comprehensive activity logging and history
- **Notes & Communication** - Internal notes and email integration

### SaaS Features
- **Multi-tenancy** - Organization-based data isolation
- **User Management** - Role-based access control (Owner, Admin, Member, Viewer)
- **Subscription Billing** - Stripe integration for payment processing
- **Multiple Auth Providers** - Email/Password, Google, GitHub
- **Team Collaboration** - Invite team members and manage permissions

### Technical Features
- **Type-Safe APIs** - End-to-end type safety with tRPC
- **Real-time Updates** - Optimistic updates with React Query
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Modern UI Components** - Beautiful components with Radix UI
- **Data Validation** - Schema validation with Zod
- **Database ORM** - Prisma for type-safe database queries

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: tRPC
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **State Management**: React Query + Zustand
- **Email**: React Email + Resend
- **Payments**: Stripe
- **Forms**: React Hook Form + Zod

## 📦 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or pnpm

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taadiway_crm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Demo Credentials** (after seeding):
- Email: `demo@taadiway.com`
- Password: `demo123`

## 📁 Project Structure

```
taadiway-crm/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/               # Next.js app router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/          # UI components
│   │   └── ...          # Feature components
│   ├── lib/             # Utilities
│   │   ├── auth.ts      # Auth configuration
│   │   ├── prisma.ts    # Prisma client
│   │   └── trpc/        # tRPC setup
│   └── server/          # Server-side code
│       └── routers/     # tRPC routers
├── .env                 # Environment variables
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## 🗄️ Database Schema

The CRM includes the following main entities:

- **Users** - System users with authentication
- **Organizations** - Multi-tenant organizations
- **Contacts** - Customer contacts
- **Companies** - Company records
- **Deals** - Sales opportunities
- **Tasks** - Action items
- **Activities** - Activity log
- **Notes** - Internal notes
- **Emails** - Email communications
- **Pipelines** - Customizable sales pipelines

## 🔒 Authentication

Supported authentication methods:
- Email/Password (with bcrypt hashing)
- Google OAuth
- GitHub OAuth

## 💳 Subscription Plans

- **Free** - Basic features for small teams
- **Starter** - Enhanced features for growing teams
- **Professional** - Advanced features for scaling businesses
- **Enterprise** - Full-featured plan with premium support

## 🚀 Deployment

### Production Deployment (Render + Neon)

**Quick Deploy (5 minutes):**

See [RENDER-DEPLOY.md](./RENDER-DEPLOY.md) for quick start guide.

**Full Documentation:**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide including:
- Neon PostgreSQL setup
- Render deployment
- Environment variables
- Custom domains
- Monitoring & scaling

### Alternative Platforms

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Docker:**
```bash
# Build
docker build -t taadiway-crm .

# Run
docker run -p 3000:3000 taadiway-crm
```

---

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

For support, email support@taadiway.com or open an issue in the repository.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [tRPC](https://trpc.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

Made with ❤️ by the Taadiway Team




## 🎯 Business Model## 🚀 Features



Taadiway operates as a warehouse and delivery service provider:### Core CRM Functionality

- **Contact Management** - Track and manage customer contacts with detailed profiles

1. **Vendors Subscribe** - Businesses subscribe to store products in Taadiway's warehouse- **Company Management** - Organize companies with industry, size, and revenue tracking

2. **Admins Manage** - Taadiway staff manage inventory, record sales, and handle deliveries- **Deal Pipeline** - Visual sales pipeline with customizable stages

3. **Vendors Monitor** - Vendors log in to view their sales performance and inventory levels in real-time- **Task Management** - Create, assign, and track tasks with priorities

- **Activity Timeline** - Comprehensive activity logging and history

## 🚀 Key Features- **Notes & Communication** - Internal notes and email integration



### For Vendors (Client Portal)### SaaS Features

- **📊 Dashboard** - Real-time overview of products, sales, and revenue- **Multi-tenancy** - Organization-based data isolation

- **📦 Product Tracking** - Monitor inventory levels in Taadiway warehouse- **User Management** - Role-based access control (Owner, Admin, Member, Viewer)

- **💰 Sales Analytics** - View sales history, trends, and revenue breakdown- **Subscription Billing** - Stripe integration for payment processing

- **⚠️ Low Stock Alerts** - Automatic notifications for products below reorder level- **Multiple Auth Providers** - Email/Password, Google, GitHub

- **📈 Performance Charts** - Visual analytics for business performance- **Team Collaboration** - Invite team members and manage permissions

- **👤 Subscription Management** - View plan details and payment history

- **🔔 Notifications** - Real-time alerts for sales and inventory changes### Technical Features

- **Type-Safe APIs** - End-to-end type safety with tRPC

### For Admins (Taadiway Staff)- **Real-time Updates** - Optimistic updates with React Query

- **👥 Client Management** - Manage vendor accounts and subscriptions- **Responsive Design** - Mobile-first UI with Tailwind CSS

- **📦 Inventory Control** - Update stock levels, record restocks and adjustments- **Modern UI Components** - Beautiful components with Radix UI

- **💵 Sales Recording** - Record sales transactions for vendor products- **Data Validation** - Schema validation with Zod

- **🚚 Delivery Tracking** - Manage delivery schedules and addresses- **Database ORM** - Prisma for type-safe database queries

- **📊 Analytics Dashboard** - Overview of all vendors and operations

- **👨‍💼 User Management** - Role-based access control for staff members## 🛠️ Tech Stack



### Subscription Plans- **Framework**: Next.js 14 (App Router)

- **BASIC** - Essential features for small vendors- **Language**: TypeScript

- **STANDARD** - Enhanced features for growing businesses- **Database**: PostgreSQL

- **PREMIUM** - Full-featured plan with priority support- **ORM**: Prisma

- **API**: tRPC

## 🛠️ Tech Stack- **Auth**: NextAuth.js

- **UI**: Tailwind CSS + Radix UI

- **Framework**: Next.js 14 (App Router)- **State Management**: React Query + Zustand

- **Language**: TypeScript- **Email**: React Email + Resend

- **Database**: PostgreSQL- **Payments**: Stripe

- **ORM**: Prisma- **Forms**: React Hook Form + Zod

- **API**: tRPC (Type-safe APIs)

- **Auth**: NextAuth.js## 📦 Prerequisites

- **UI**: Tailwind CSS + Radix UI

- **State**: React Query (TanStack Query v4)- Node.js 18+ 

- **Payments**: Stripe (ready)- PostgreSQL 14+

- npm or pnpm

## 📦 Prerequisites

## 🚀 Getting Started

- Node.js 18+

- PostgreSQL 14+### 1. Clone and Install

- npm or pnpm

```bash

## 🚀 Quick Start# Install dependencies

npm install

### 1. Install Dependencies

# Copy environment variables

```bashcp .env.example .env

npm install```

```

### 2. Configure Environment Variables

### 2. Configure Environment

Edit `.env` with your configuration:

Copy `.env.example` to `.env` and configure:

```env

```env# Database

# DatabaseDATABASE_URL="postgresql://user:password@localhost:5432/taadiway_crm"

DATABASE_URL="postgresql://user:password@localhost:5432/taadiway_crm"

# NextAuth

# NextAuthNEXTAUTH_URL="http://localhost:3000"

NEXTAUTH_URL="http://localhost:3000"NEXTAUTH_SECRET="your-secret-key"

NEXTAUTH_SECRET="your-random-secret-key"

# Add your API keys for optional features

# Optional: OAuth Providers```

GOOGLE_CLIENT_ID="your-google-client-id"

GOOGLE_CLIENT_SECRET="your-google-client-secret"### 3. Set Up Database

GITHUB_ID="your-github-client-id"

GITHUB_SECRET="your-github-client-secret"```bash

```# Generate Prisma Client

npm run db:generate

### 3. Set Up Database

# Run migrations

```bashnpm run db:migrate

# Generate Prisma Client

npm run db:generate# Seed database (optional)

npm run db:seed

# Run migrations```

npm run db:migrate

### 4. Start Development Server

# Seed with demo data (optional)

npm run db:seed```bash

```npm run dev

```

### 4. Start Development Server

Visit [http://localhost:3000](http://localhost:3000)

```bash

npm run dev## 📁 Project Structure

```

```

Visit [http://localhost:3000](http://localhost:3000)taadiway-crm/

├── prisma/

**Demo Credentials** (after seeding):│   ├── schema.prisma       # Database schema

- Email: `demo@taadiway.com`│   └── seed.ts            # Seed data

- Password: `demo123`├── src/

│   ├── app/               # Next.js app router

## 📁 Project Structure│   │   ├── api/          # API routes

│   │   ├── auth/         # Authentication pages

```│   │   ├── dashboard/    # Dashboard pages

taadiway-crm/│   │   └── layout.tsx    # Root layout

├── docs/                      # Documentation│   ├── components/       # React components

│   ├── VENDOR-PORTAL-API.md  # Complete vendor API reference│   │   ├── ui/          # UI components

│   ├── VENDOR-PORTAL-SUMMARY.md│   │   └── ...          # Feature components

│   ├── VENDOR-API-QUICK-REF.md│   ├── lib/             # Utilities

│   ├── DATABASE.md           # Database schema documentation│   │   ├── auth.ts      # Auth configuration

│   ├── USER-MANAGEMENT.md    # User & role management│   │   ├── prisma.ts    # Prisma client

│   └── SETUP.md              # Detailed setup guide│   │   └── trpc/        # tRPC setup

├── prisma/│   └── server/          # Server-side code

│   ├── schema.prisma         # Database schema│       └── routers/     # tRPC routers

│   ├── seed.ts              # Seed data├── .env                 # Environment variables

│   └── migrations/          # Database migrations├── next.config.js       # Next.js configuration

├── src/├── tailwind.config.js   # Tailwind configuration

│   ├── app/                 # Next.js app router└── tsconfig.json        # TypeScript configuration

│   │   ├── api/            # API routes```

│   │   │   ├── auth/       # NextAuth endpoints

│   │   │   └── trpc/       # tRPC endpoints## 🗄️ Database Schema

│   │   ├── auth/           # Auth pages

│   │   ├── dashboard/      # Dashboard pagesThe CRM includes the following main entities:

│   │   └── landing/        # Landing page

│   ├── components/         # React components- **Users** - System users with authentication

│   │   ├── ui/            # UI components- **Organizations** - Multi-tenant organizations

│   │   ├── dashboard/     # Dashboard components- **Contacts** - Customer contacts

│   │   └── analytics/     # Analytics components- **Companies** - Company records

│   ├── lib/               # Utilities- **Deals** - Sales opportunities

│   │   ├── auth.ts        # Auth configuration- **Tasks** - Action items

│   │   ├── prisma.ts      # Prisma client- **Activities** - Activity log

│   │   └── trpc/          # tRPC setup- **Notes** - Internal notes

│   ├── server/            # Server-side code- **Emails** - Email communications

│   │   └── routers/       # tRPC API routers- **Pipelines** - Customizable sales pipelines

│   │       ├── vendor.ts  # Vendor portal API ✨

│   │       ├── client.ts  # Admin client management## 🔒 Authentication

│   │       ├── product.ts # Product management

│   │       ├── sale.ts    # Sales recordingSupported authentication methods:

│   │       ├── inventory.ts- Email/Password (with bcrypt hashing)

│   │       ├── user.ts- Google OAuth

│   │       └── _app.ts    # Router registry- GitHub OAuth

│   └── types/             # TypeScript types

├── public/                # Static files## 💳 Subscription Plans

│   └── logo.png          # Taadiway logo

├── QUICK-START.md        # Quick start guide- **Free** - Basic features for small teams

└── README.md             # This file- **Starter** - Enhanced features for growing teams

```- **Professional** - Advanced features for scaling businesses

- **Enterprise** - Full-featured plan with premium support

## 🗄️ Database Schema

## 🚀 Deployment

### Core Models

### Vercel (Recommended)

- **User** - System users with authentication

- **AdminProfile** - Taadiway staff with granular permissions```bash

- **ClientProfile** - Vendor accounts with subscription status# Install Vercel CLI

- **Product** - Products stored in warehousenpm i -g vercel

- **Sale** - Sales transactions

- **SaleItem** - Individual items in sales# Deploy

- **InventoryLog** - Inventory change historyvercel

- **Subscription** - Vendor subscription plans```

- **Payment** - Payment records

- **Notification** - System notifications### Docker



See [docs/DATABASE.md](docs/DATABASE.md) for complete schema documentation.```bash

# Build

## 🔐 Authentication & Rolesdocker build -t taadiway-crm .



### User Roles# Run

docker run -p 3000:3000 taadiway-crm

- **SUPER_ADMIN** - Full system access```

- **ADMIN** - Taadiway staff with admin permissions

- **MANAGER** - Team managers## 📝 Scripts

- **STAFF** - Regular Taadiway employees

- **USER** - Vendors (clients)- `npm run dev` - Start development server

- `npm run build` - Build for production

### Admin Permissions- `npm run start` - Start production server

- `npm run lint` - Run ESLint

AdminProfile includes granular permissions:- `npm run db:generate` - Generate Prisma Client

- `canManageClients` - Manage vendor accounts- `npm run db:push` - Push schema to database

- `canRecordSales` - Record sales transactions- `npm run db:migrate` - Run migrations

- `canManageInventory` - Update inventory- `npm run db:seed` - Seed database

- `canManageUsers` - Manage staff users- `npm run db:studio` - Open Prisma Studio

- `canViewReports` - Access analytics

- `canManageSettings` - System configuration## 🤝 Contributing

- `canDeleteData` - Delete records

- `canManagePayments` - Handle paymentsContributions are welcome! Please follow these steps:

- `canExportData` - Export data

- `canManageProducts` - Manage products1. Fork the repository

- `canApproveRefunds` - Process refunds2. Create a feature branch

- `maxDiscountPercent` - Maximum discount allowed3. Commit your changes

4. Push to the branch

See [docs/USER-MANAGEMENT.md](docs/USER-MANAGEMENT.md) for details.5. Open a Pull Request



## 📊 Vendor Portal API## 📄 License



Complete type-safe API for vendors to view their data:MIT License - feel free to use this project for personal or commercial purposes.



```typescript## 🆘 Support

import { trpc } from '@/lib/trpc/client';

For support, email support@taadiway.com or open an issue in the repository.

// Get dashboard overview

const { data } = trpc.vendor.getDashboard.useQuery();## 🙏 Acknowledgments



// Get products with filtersBuilt with:

const { data: products } = trpc.vendor.getMyProducts.useQuery({- [Next.js](https://nextjs.org/)

  page: 1,- [Prisma](https://www.prisma.io/)

  limit: 20,- [tRPC](https://trpc.io/)

  stockStatus: 'low-stock',- [Tailwind CSS](https://tailwindcss.com/)

  search: 'soap'- [Radix UI](https://www.radix-ui.com/)

});

---

// Get sales analytics

const { data: analytics } = trpc.vendor.getSalesAnalytics.useQuery({Made with ❤️ by the Taadiway Team
  period: '30days'
});
```

**Available Endpoints:**
- `getDashboard` - Overview with stats and top products
- `getMyProducts` - Product list with pagination
- `getProductDetails` - Single product details
- `getMySales` - Sales history
- `getSalesSummary` - Aggregated statistics
- `getSalesAnalytics` - Trends over time
- `getRevenueBreakdown` - Revenue by product
- `getNotifications` - Notification management
- `getLowStockAlerts` - Low stock warnings
- `getMySubscription` - Subscription info

See [docs/VENDOR-PORTAL-API.md](docs/VENDOR-PORTAL-API.md) for complete API documentation.

## 🎨 UI Components

Built with Tailwind CSS and Radix UI:
- Modern, responsive design
- Taadiway brand colors (yellow/orange gradient)
- Accessible components
- Dark mode ready

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema (dev only)
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Utilities
npm run type-check      # Check TypeScript
npm run format          # Format code with Prettier
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Setup

1. Create PostgreSQL database (recommend Railway, Supabase, or Neon)
2. Add `DATABASE_URL` to environment variables
3. Run migrations: `npx prisma migrate deploy`

### Environment Variables

Required for production:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Optional:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID` / `GITHUB_SECRET`
- `STRIPE_SECRET_KEY` (for payments)

## 📚 Documentation

- **[Vendor Portal API](docs/VENDOR-PORTAL-API.md)** - Complete API reference
- **[Quick Reference](docs/VENDOR-API-QUICK-REF.md)** - API quick reference
- **[Implementation Summary](docs/VENDOR-PORTAL-SUMMARY.md)** - Implementation guide
- **[Database Schema](docs/DATABASE.md)** - Database documentation
- **[User Management](docs/USER-MANAGEMENT.md)** - Roles and permissions
- **[Setup Guide](docs/SETUP.md)** - Detailed setup instructions

## 🔒 Security Features

- ✅ NextAuth.js authentication
- ✅ Role-based access control (RBAC)
- ✅ Data isolation per vendor
- ✅ Secure password hashing
- ✅ CSRF protection
- ✅ Type-safe API with validation
- ✅ SQL injection prevention (Prisma ORM)

## 📞 Support

- **Phone:** 0559 220 442
- **Email:** support@taadiway.com
- **Documentation:** `/docs` folder

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🙏 Built With

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [tRPC](https://trpc.io/) - Type-safe APIs
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - UI components
- [React Query](https://tanstack.com/query) - Data fetching

---

**Made with ❤️ for Taadiway**

*Empowering vendors with seamless warehouse and delivery management*
