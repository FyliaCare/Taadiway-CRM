# Migration Troubleshooting Guide

## Problem: Failed Migration Error (P3009)

**Error Message:**
```
migrate found failed migrations in the target database
The `20251024185709_taadiway_crm` migration started at ... failed
```

---

## Solution Options

### Option 1: Reset the Production Database (DESTRUCTIVE - Data Loss)

⚠️ **WARNING**: This will delete all data in the database!

Only use this for:
- Fresh deployments
- Development/staging environments
- When you have a backup

```bash
# 1. Backup your data first!
npx prisma db pull > backup-schema.prisma

# 2. Reset the database
npx prisma migrate reset --force

# 3. Deploy migrations
npx prisma migrate deploy

# 4. Seed demo data
npx prisma db seed
```

---

### Option 2: Mark Failed Migration as Applied (RECOMMENDED)

Use this when the migration partially succeeded or when schema is already correct.

```bash
# 1. Check migration status
npx prisma migrate status

# 2. If migration shows as failed, mark it as applied
npx prisma migrate resolve --applied "20251024185709_taadiway_crm"

# 3. Deploy remaining migrations
npx prisma migrate deploy
```

---

### Option 3: Mark as Rolled Back and Reapply

Use this when migration truly failed and needs to run again.

```bash
# 1. Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20251024185709_taadiway_crm"

# 2. Deploy migrations (will reapply the rolled-back one)
npx prisma migrate deploy
```

---

### Option 4: Use the Fix Script (Easiest)

**Windows (PowerShell):**
```powershell
.\scripts\fix-migrations.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/fix-migrations.sh
./scripts/fix-migrations.sh
```

---

## For Render.com Deployment

If you're deploying to Render and seeing this error:

### Method 1: Environment Variable Override

Add this to your Render environment variables:
```
DATABASE_URL=your_neon_pooled_url
DIRECT_URL=your_neon_direct_url
```

Then in Render's deploy hook, run:
```bash
npx prisma migrate deploy || npx prisma migrate resolve --applied "20251024185709_taadiway_crm" && npx prisma migrate deploy
```

### Method 2: Fresh Start

1. Go to Render Dashboard
2. Delete the service
3. Create new Web Service
4. Connect your GitHub repo
5. Set environment variables:
   - `DATABASE_URL` - Your Neon pooled connection
   - `DIRECT_URL` - Your Neon direct connection
6. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
7. Start command: `npm start`

---

## Preventing Future Issues

### Update Your Build Script

**package.json:**
```json
{
  "scripts": {
    "production:build": "prisma generate && prisma migrate deploy && next build",
    "production:start": "next start -p ${PORT:-3000}",
    "deploy": "npx prisma migrate deploy || (npx prisma migrate status && exit 1)"
  }
}
```

### Use Neon's Direct URL

Make sure your `.env` has both URLs:

```env
# Pooled connection (for app queries)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/db"
```

---

## Common Causes

1. **Connection Timeout** - Neon's pooler doesn't support advisory locks
   - ✅ Solution: Use `DIRECT_URL` for migrations

2. **Migration Interrupted** - Deployment timeout or network issue
   - ✅ Solution: Mark as applied if schema is correct

3. **Schema Drift** - Manual database changes
   - ✅ Solution: Run `prisma db pull` and create new migration

4. **Wrong Database** - Multiple Neon projects/branches
   - ✅ Solution: Verify DATABASE_URL matches intended database

---

## Verification Steps

After applying any fix:

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Verify schema matches
npx prisma db pull

# 3. Check database connectivity
npx prisma db execute --stdin <<< "SELECT 1;"

# 4. Test the application
npm run dev
```

---

## Emergency Contacts

If you're still having issues:

1. Check Neon Status: https://neon.tech/status
2. Prisma Docs: https://pris.ly/d/migrate-resolve
3. Neon Docs: https://neon.tech/docs/guides/prisma

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx prisma migrate status` | Check migration status |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npx prisma migrate resolve --applied "name"` | Mark migration as applied |
| `npx prisma migrate resolve --rolled-back "name"` | Mark migration as rolled back |
| `npx prisma migrate reset` | ⚠️ Reset database (data loss) |
| `npx prisma db seed` | Add demo data |
| `npx prisma studio` | Open database GUI |

---

**Last Updated**: October 28, 2025
