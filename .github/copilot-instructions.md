# Taadiway CRM - Project Guidelines

## Project Overview
This is a comprehensive, full-stack SaaS CRM system built with Next.js 14, TypeScript, Prisma, tRPC, and NextAuth.js.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe APIs
- **Auth**: NextAuth.js with multiple providers
- **UI**: Tailwind CSS + Radix UI components
- **State**: React Query (TanStack Query v4)
- **Payments**: Stripe integration ready

## Key Features
- Multi-tenancy with organization-based data isolation
- Complete contact and company management
- Sales pipeline with deals tracking
- Task management system
- Activity timeline
- Role-based access control (RBAC)
- Subscription billing infrastructure

## Development Setup Completed
✅ All dependencies installed
✅ Prisma schema defined with 15+ models
✅ tRPC API routers for all entities
✅ NextAuth.js authentication configured
✅ Dashboard layout and core UI components
✅ Build successful
✅ Development server running

## Database Setup Required
Before full functionality, you need to:
1. Set up PostgreSQL database
2. Update DATABASE_URL in .env
3. Run: `npm run db:migrate`
4. Run: `npm run db:seed` (optional demo data)

## Authentication
- Demo credentials available after seeding: demo@taadiway.com / demo123
- OAuth providers configurable (Google, GitHub)

## Project Structure
- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components
- `/src/lib` - Utilities and configurations
- `/src/server/routers` - tRPC API endpoints
- `/prisma` - Database schema and migrations

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Code Style
- Use TypeScript for all new files
- Follow existing patterns for tRPC routers
- Use shadcn/ui patterns for components
- Keep multi-tenancy in mind (organizationId filtering)