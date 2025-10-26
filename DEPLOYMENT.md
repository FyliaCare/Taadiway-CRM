# 🚀 Deployment Guide - Render & Neon

Complete guide to deploy Taadiway CRM to production using Render (hosting) and Neon (PostgreSQL database).

---

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup (Neon)](#database-setup-neon)
- [Application Deployment (Render)](#application-deployment-render)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Required Accounts:**
- [Render Account](https://render.com) (Free tier available)
- [Neon Account](https://neon.tech) (Free tier available)
- GitHub account with repository access

✅ **Repository:**
- Code pushed to GitHub/GitLab
- All changes committed

---

## 🗄️ Database Setup (Neon)

### Step 1: Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Click **"New Project"**
3. Configure:
   - **Name**: `taadiway-crm`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 or 16
4. Click **"Create Project"**

### Step 2: Get Database Connection String

1. In Neon dashboard, go to **Dashboard** → **Connection Details**
2. Copy the **Connection string** (format: `postgresql://...`)
3. **Important**: Note down this connection string - you'll need it for Render

Example format:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Configure Connection Pooling (Recommended)

1. In Neon dashboard, enable **Connection Pooling**
2. Copy the **Pooled connection string** instead
3. This improves performance for serverless deployments

---

## 🌐 Application Deployment (Render)

### Option A: Deploy with Blueprint (Recommended)

1. Push `render.yaml` to your repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml`
6. Click **"Apply"** to create all services

### Option B: Manual Deployment

#### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `taadiway-crm`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave blank
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run production:build`
   - **Start Command**: `npm run production:start`
   - **Plan**: Free or Starter

#### Step 2: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

##### Required Variables:
```bash
NODE_ENV=production
NODE_VERSION=18.17.0

# Database (from Neon)
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# App
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

##### Optional Variables (Add as needed):

**OAuth Providers:**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Payment Providers:**
```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_CALLBACK_URL=https://your-app.onrender.com/api/webhooks/paystack

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_MODE=live
```

**Email:**
```bash
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
```

**Performance:**
```bash
REVALIDATION_SECRET=your-revalidation-secret
```

#### Step 3: Configure Health Check

1. In Render dashboard, go to **Settings**
2. Set **Health Check Path**: `/api/health`
3. Save changes

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build Next.js application
   - Start production server

---

## 🔐 Environment Variables

### Critical Security Notes:

⚠️ **Never commit these to Git:**
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- API keys (Paystack, PayPal, Resend, etc.)

✅ **Add to Render Environment tab**

### Variable Descriptions:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `NEXTAUTH_URL` | ✅ | Your Render app URL |
| `NEXTAUTH_SECRET` | ✅ | Secret for session encryption (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public-facing app URL |
| `GOOGLE_CLIENT_ID` | ❌ | For Google OAuth |
| `PAYSTACK_SECRET_KEY` | ❌ | For Paystack payments |
| `RESEND_API_KEY` | ❌ | For sending emails |

---

## 📦 Post-Deployment

### Step 1: Verify Deployment

1. Check Render logs for successful build
2. Visit your app URL: `https://your-app.onrender.com`
3. Check health endpoint: `https://your-app.onrender.com/api/health`

### Step 2: Run Database Migrations

Migrations run automatically during build via `production:build` script.

**Manual migration (if needed):**
```bash
# In Render Shell
npm run db:migrate:deploy
```

### Step 3: Seed Database (Optional)

⚠️ **Only for demo/testing:**
```bash
# In Render Shell
npm run db:seed
```

### Step 4: Create First Super Admin

1. Sign up through the app
2. Connect to Neon database via pgAdmin or Neon SQL Editor
3. Run:
```sql
UPDATE "User" 
SET "role" = 'SUPER_ADMIN', 
    "isSuperAdmin" = true
WHERE email = 'your-email@example.com';
```

### Step 5: Configure Custom Domain (Optional)

1. In Render dashboard, go to **Settings** → **Custom Domains**
2. Add your domain (e.g., `app.taadiway.com`)
3. Update DNS records as instructed
4. Update environment variables:
   - `NEXTAUTH_URL=https://app.taadiway.com`
   - `NEXT_PUBLIC_APP_URL=https://app.taadiway.com`

---

## 🔍 Monitoring & Maintenance

### Health Checks

Render automatically monitors: `https://your-app.onrender.com/api/health`

### View Logs

```bash
# In Render Dashboard
Logs → View Live Logs
```

### Database Backups

**Neon:**
- Automatic daily backups (Free tier: 7 days retention)
- Manual backups: Neon Console → Backups → Create Backup

### Scaling

**Render:**
- Free tier: Auto-sleep after 15 min inactivity
- Starter plan ($7/mo): Always-on, no sleep
- Standard plan: Horizontal scaling

**Neon:**
- Free tier: 0.5 GB storage, 1 compute unit
- Pro tier: Auto-scaling, more storage

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Cannot find module 'prisma'`
```bash
# Solution: Ensure Prisma is in dependencies (not devDependencies)
npm install prisma @prisma/client
```

**Error**: `DATABASE_URL not found`
```bash
# Solution: Add DATABASE_URL in Render Environment tab
```

### Runtime Errors

**Error**: `Cannot connect to database`
- Verify Neon connection string is correct
- Ensure `?sslmode=require` is in connection string
- Check Neon database is not paused (free tier auto-pauses)

**Error**: `NEXTAUTH_URL mismatch`
- Update `NEXTAUTH_URL` to match your Render URL
- Redeploy after changing environment variables

### Performance Issues

**Slow initial load:**
- Upgrade to Render Starter plan (no cold starts)
- Enable Neon connection pooling

**Database connection errors:**
- Use Neon pooled connection string
- Increase Prisma connection pool size

---

## 📚 Additional Resources

### Render Documentation
- [Deploy Next.js](https://render.com/docs/deploy-nextjs-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Health Checks](https://render.com/docs/health-checks)

### Neon Documentation
- [Getting Started](https://neon.tech/docs/get-started-with-neon)
- [Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Prisma Integration](https://neon.tech/docs/guides/prisma)

### Next.js Production
- [Deployment Best Practices](https://nextjs.org/docs/deployment)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ Deployment Checklist

- [ ] Neon database created
- [ ] Connection string copied
- [ ] Render web service created
- [ ] All required environment variables added
- [ ] `render.yaml` pushed to repository
- [ ] Build successful
- [ ] Health check passing
- [ ] Database migrations completed
- [ ] First admin user created
- [ ] OAuth providers configured (if needed)
- [ ] Payment providers configured (if needed)
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

---

## 🚀 Quick Deploy Commands

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "Prepare for production deployment"
git push origin main

# 2. Render will auto-deploy on push (if auto-deploy enabled)

# 3. Verify deployment
curl https://your-app.onrender.com/api/health
```

---

## 🆘 Support

**Issues?**
- Check Render logs: Dashboard → Logs
- Check Neon database: Neon Console → Monitoring
- Review environment variables
- Verify build command ran successfully

**Need Help?**
- Render: https://render.com/docs
- Neon: https://neon.tech/docs
- Next.js: https://nextjs.org/docs

---

**🎉 Your app is now live and production-ready!**

Access at: `https://your-app.onrender.com`
