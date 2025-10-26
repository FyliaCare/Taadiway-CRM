# Database Schema Overview

## Models Summary

This CRM includes **17 database models** covering all aspects of customer relationship management.

## Core Models

### 1. User (Authentication)
- Email/password and OAuth authentication
- Role-based access (SUPER_ADMIN, ADMIN, MANAGER, USER)
- Links to accounts, sessions, and organization memberships

### 2. Organization (Multi-tenancy)
- Company/tenant isolation
- Subscription plans (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- Status tracking (ACTIVE, SUSPENDED, CANCELLED)
- Contains all CRM data scoped to organization

### 3. OrganizationUser (Team Management)
- User-to-organization relationship
- Organization roles (OWNER, ADMIN, MEMBER, VIEWER)
- Join date tracking

### 4. Contact (CRM Core)
**Fields:**
- Personal info (name, email, phone, mobile)
- Professional info (title, department, company)
- Contact details (address, city, state, country)
- Status (ACTIVE, INACTIVE, LEAD, CUSTOMER, LOST)
- Lead source tracking
- Social profiles (LinkedIn, Twitter)
- Tags for categorization

**Relationships:**
- Belongs to organization and company
- Has many deals, tasks, activities, notes, emails

### 5. Company (CRM Core)
**Fields:**
- Basic info (name, website, industry, size)
- Revenue tracking
- Contact details (email, phone, address)
- Status (ACTIVE, INACTIVE, PROSPECT, CUSTOMER, PARTNER)
- Social profiles
- Tags

**Relationships:**
- Belongs to organization
- Has many contacts, deals, tasks, activities, notes

### 6. Deal (Sales Pipeline)
**Fields:**
- Deal info (title, description, value, currency)
- Probability and expected close date
- Pipeline stage
- Status (OPEN, WON, LOST, ABANDONED)
- Tags

**Relationships:**
- Belongs to organization, pipeline, contact, company
- Assigned to user
- Has many tasks, activities, notes

### 7. Pipeline (Sales Process)
**Fields:**
- Name and description
- Default flag
- Stages (JSON array with id, name, order, probability)

**Relationships:**
- Belongs to organization
- Has many deals

### 8. Task (Activity Management)
**Fields:**
- Title and description
- Due date
- Priority (LOW, MEDIUM, HIGH, URGENT)
- Status (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- Type (CALL, EMAIL, MEETING, FOLLOW_UP, GENERAL)
- Completion tracking

**Relationships:**
- Belongs to organization
- Links to contact, company, deal
- Assigned to user

### 9. Activity (Timeline & History)
**Fields:**
- Activity type (NOTE, CALL, EMAIL, MEETING, TASK_CREATED, etc.)
- Title and description
- Metadata (JSON for flexible data)
- Timestamp

**Relationships:**
- Belongs to organization
- Links to contact, company, deal
- Created by user

### 10. Note (Documentation)
**Fields:**
- Content (rich text)
- Pinned flag
- Timestamps

**Relationships:**
- Belongs to organization
- Links to contact, company, deal
- Created by user

### 11. Email (Communication)
**Fields:**
- Subject and body
- From, to, cc, bcc
- Status (DRAFT, SENT, FAILED)
- Sent timestamp

**Relationships:**
- Belongs to organization
- Links to contact
- Created by user

### 12. CustomField (Extensibility)
**Fields:**
- Field configuration (name, label)
- Entity type (CONTACT, COMPANY, DEAL)
- Field type (TEXT, NUMBER, DATE, SELECT, etc.)
- Options for select fields
- Required flag
- Display order

**Relationships:**
- Belongs to organization

## Supporting Models

### 13. Account (NextAuth)
OAuth provider accounts linked to users

### 14. Session (NextAuth)
User session management

### 15. VerificationToken (NextAuth)
Email verification and password reset tokens

### 16. Subscription (Billing)
**Fields:**
- Stripe integration (customer ID, subscription ID, price ID)
- Current period end
- Status tracking

**Relationships:**
- One-to-one with organization

## Key Features

### Multi-Tenancy
- All CRM data scoped by `organizationId`
- Complete data isolation between organizations
- Organization-level roles and permissions

### Relationships
- Contact ↔ Company (many-to-one)
- Deal ↔ Contact (many-to-one)
- Deal ↔ Company (many-to-one)
- Deal ↔ Pipeline (many-to-one)
- Task ↔ Contact/Company/Deal (many-to-one)
- Activity ↔ Contact/Company/Deal (many-to-one)

### Audit Trail
- `createdAt` and `updatedAt` timestamps on all models
- `createdBy` user tracking
- Activity log for all important events

### Flexible Data
- Tags on contacts, companies, and deals
- Custom fields for extensibility
- Metadata JSON fields for additional data

## Indexes

Key indexes for performance:
- Organization IDs on all tenant-scoped tables
- Email lookups on contacts
- Status fields on contacts, companies, deals
- Date fields on tasks and activities

## Enums

### UserRole
- SUPER_ADMIN
- ADMIN
- MANAGER
- USER

### OrgRole
- OWNER
- ADMIN
- MEMBER
- VIEWER

### Plan
- FREE
- STARTER
- PROFESSIONAL
- ENTERPRISE

### ContactStatus
- ACTIVE
- INACTIVE
- LEAD
- CUSTOMER
- LOST

### CompanyStatus
- ACTIVE
- INACTIVE
- PROSPECT
- CUSTOMER
- PARTNER

### DealStatus
- OPEN
- WON
- LOST
- ABANDONED

### TaskStatus
- TODO
- IN_PROGRESS
- COMPLETED
- CANCELLED

### Priority
- LOW
- MEDIUM
- HIGH
- URGENT

### TaskType
- CALL
- EMAIL
- MEETING
- FOLLOW_UP
- GENERAL

### ActivityType
- NOTE
- CALL
- EMAIL
- MEETING
- TASK_CREATED
- TASK_COMPLETED
- DEAL_CREATED
- DEAL_WON
- DEAL_LOST
- STAGE_CHANGED
- CONTACT_CREATED
- COMPANY_CREATED

### EntityType (CustomFields)
- CONTACT
- COMPANY
- DEAL

### FieldType
- TEXT
- NUMBER
- DATE
- SELECT
- MULTI_SELECT
- CHECKBOX
- URL
- EMAIL
- PHONE

## Database Provider

Configured for **PostgreSQL** but can be adapted for:
- MySQL
- SQLite
- SQL Server
- CockroachDB
- MongoDB (with adjustments)

## Migration Strategy

Use Prisma Migrate for version-controlled schema changes:
```bash
npm run db:migrate      # Create and apply migration
npm run db:push         # Push schema without migration (dev only)
npm run db:studio       # Visual database browser
```

## Seeding

Demo data includes:
- Demo user account
- Sample organization
- Default sales pipeline
- Sample contacts and companies
- Sample deals at different stages

Run with: `npm run db:seed`