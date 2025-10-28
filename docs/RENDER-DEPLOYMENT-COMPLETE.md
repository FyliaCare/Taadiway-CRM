# Complete Render.com Deployment Guide - Taadiway CRM

## 🚀 Prerequisites

1. ✅ GitHub account with your code pushed
2. ✅ Render.com account (free tier works)
3. ✅ Neon PostgreSQL database (free tier works)

---

## 📋 Step-by-Step Deployment

### Step 1: Setup Neon Database

1. Go to https://neon.tech and sign up/login
2. Create a new project: "Taadiway CRM"
3. Select region: **EU Central 1** (or closest to your users)
4. Get your connection strings:

**Pooled Connection (for application):**
```
postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Direct Connection (for migrations - REMOVE -pooler):**
```
postgresql://neondb_owner:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ **CRITICAL**: You need BOTH URLs. Direct URL is same as pooled but WITHOUT `-pooler` in the hostname.

---

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `FyliaCare/Taadiway-CRM`
4. Configure the service:

**Basic Settings:**
- **Name**: `taadiway-crm`
- **Region**: `Oregon` (or closest to your Neon DB)
- **Branch**: `main`
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `chmod +x scripts/build.sh && ./scripts/build.sh`
- **Start Command**: `npm run production:start`

---

### Step 3: Configure Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

#### Required Variables:

```bash
# Node Configuration
NODE_VERSION=18.17.0
NODE_ENV=production

# Database - Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15

DIRECT_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30

# NextAuth - CRITICAL
NEXTAUTH_URL=https://taadiway-crm.onrender.com
NEXTAUTH_SECRET=<Generate using: openssl rand -base64 32>

# App URLs
NEXT_PUBLIC_APP_URL=https://taadiway-crm.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM

# Cache/Revalidation
REVALIDATION_SECRET=<Generate using: openssl rand -hex 32>
```

#### Optional Variables (add if using these features):

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@taadiway.com

# Payment - Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_CALLBACK_URL=https://taadiway-crm.onrender.com/api/webhooks/paystack

# Payment - PayPal
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx
PAYPAL_MODE=live

# OAuth - Google
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# OAuth - GitHub
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

---

### Step 4: Generate Secrets

On your local machine, run these commands:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate REVALIDATION_SECRET
openssl rand -hex 32
```

Copy the output and paste into Render environment variables.

---

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Install dependencies
   - Generate Prisma Client
   - Run database migrations
   - Build Next.js application
   - Start the server

3. Watch the deployment logs for any errors

---

## ✅ Post-Deployment Verification

### 1. Check Health Endpoint

Visit: `https://taadiway-crm.onrender.com/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T..."
}
```

### 2. Check Database Connection

In Render logs, you should see:
```
✅ Database connected successfully
```

### 3. Seed Database (First Time Only)

**Option A: Via Render Shell**
1. Go to your service in Render
2. Click **"Shell"** tab
3. Run:
```bash
npm run db:seed
```

**Option B: Via Local Connection**
1. Update your local `.env` with production `DIRECT_URL`
2. Run: `npm run db:seed`
3. Restore local `.env`

### 4. Test Login

Visit: `https://taadiway-crm.onrender.com/auth/signin`

**Demo Accounts:**
```
Admin:
Email: admin@taadiway.com
Password: admin123

Restaurant:
Email: restaurant@example.com
Password: client123

Shop:
Email: shop@example.com
Password: client123
```

---

## 🔧 Troubleshooting

### Error: "P3009: migrate found failed migrations"

**Solution 1: Mark as Applied**
```bash
# In Render Shell
npx prisma migrate resolve --applied "20251024185709_taadiway_crm"
npx prisma migrate deploy
```

**Solution 2: Check DIRECT_URL**
- Ensure `DIRECT_URL` does NOT have `-pooler` in hostname
- Ensure it's set in environment variables

### Error: "Can't reach database server"

**Check:**
1. ✅ `DATABASE_URL` has `-pooler` in hostname
2. ✅ `DIRECT_URL` does NOT have `-pooler`
3. ✅ Both URLs end with `?sslmode=require`
4. ✅ Password is correct (no special characters need escaping)
5. ✅ Neon database is not paused (free tier auto-pauses)

### Error: "Invalid environment variables"

**Check:**
1. ✅ `NEXTAUTH_URL` matches your Render URL
2. ✅ `NEXTAUTH_SECRET` is at least 32 characters
3. ✅ `NEXT_PUBLIC_APP_URL` matches your Render URL
4. ✅ No trailing slashes in URLs

### Error: "Module not found" or build fails

**Solution:**
```bash
# In Render: Settings → Build Command
chmod +x scripts/build.sh && ./scripts/build.sh
```

If still failing, check Render logs for specific module.

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push

Render automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deploy

1. Go to Render dashboard
2. Click your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎯 Performance Optimization

### 1. Enable Auto-Scaling (Paid Plans)

Render Settings → Scaling:
- Instances: 2-5 (based on traffic)
- Auto-scale triggers

### 2. Use CDN for Static Assets

Already configured in `next.config.js`:
- Images optimized (AVIF/WebP)
- Static files cached 1 year
- Code splitting enabled

### 3. Database Connection Pooling

Already configured:
- Neon pgbouncer enabled
- Connection timeout: 15s
- Max connections handled by Neon

---

## 📊 Monitoring

### Render Built-in Metrics

Dashboard → Your Service → Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

### Custom Health Checks

Already configured:
- Health endpoint: `/api/health`
- Timeout: 30s
- Interval: 60s

### Logs

View real-time logs:
```bash
# In Render dashboard
Logs → Live tail
```

---

## 🔐 Security Checklist

- ✅ NEXTAUTH_SECRET is strong (32+ chars)
- ✅ Database credentials not in code
- ✅ HTTPS enabled (automatic on Render)
- ✅ Security headers configured
- ✅ CORS properly set
- ✅ Rate limiting enabled
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (Next.js)

---

## 💰 Cost Estimate

**Free Tier (Getting Started):**
- Render Web Service: $0 (750 hrs/month)
- Neon Database: $0 (3 GB storage, 0.5 compute)
- **Total: $0/month**

**Starter Tier (Production):**
- Render Web Service: $7/month
- Neon Pro: $19/month
- **Total: $26/month**

**Pro Tier (Scale):**
- Render Standard: $25/month
- Neon Scale: $69/month
- **Total: $94/month**

---

## 🆘 Support Resources

### Documentation
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

### Community
- Render Community: https://community.render.com
- Neon Discord: https://discord.gg/neon
- GitHub Issues: https://github.com/FyliaCare/Taadiway-CRM/issues

---

## 🎉 Success Checklist

- ✅ Database created on Neon
- ✅ Both DATABASE_URL and DIRECT_URL set
- ✅ All required environment variables configured
- ✅ Build completed without errors
- ✅ Health endpoint returns 200 OK
- ✅ Database seeded with demo data
- ✅ Can login with admin account
- ✅ Dashboard loads properly
- ✅ Auto-deploy enabled

---

**Congratulations! Your Taadiway CRM is now live on Render! 🚀**

**Your App:** https://taadiway-crm.onrender.com

---

## 📝 Quick Reference

### Essential Commands

```bash
# Check migration status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# View database in browser
npx prisma studio

# Check build locally
npm run production:build
```

### Environment Variable Template

```bash
NODE_VERSION=18.17.0
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.region.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
DIRECT_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.region.neon.tech/neondb?sslmode=require&connect_timeout=30
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=<generated-secret>
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM
REVALIDATION_SECRET=<generated-secret>
```

---

**Last Updated:** October 28, 2025
**Version:** 1.0.0
