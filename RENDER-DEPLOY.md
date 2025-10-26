# 🚀 Render Deployment - Quick Start

## Prerequisites
- ✅ Neon database created
- ✅ Render account created
- ✅ Code pushed to GitHub

## Deploy in 5 Minutes

### Step 1: Create Neon Database (2 min)
1. Go to https://console.neon.tech
2. Create new project: **taadiway-crm**
3. Copy connection string (starts with `postgresql://`)

### Step 2: Deploy to Render (3 min)
1. Go to https://dashboard.render.com
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically
5. Add environment variables:
   ```
   DATABASE_URL = [paste Neon connection string]
   NEXTAUTH_URL = https://your-app.onrender.com
   NEXTAUTH_SECRET = [generate with: openssl rand -base64 32]
   NEXT_PUBLIC_APP_URL = https://your-app.onrender.com
   ```
6. Click **"Apply"**

### Step 3: Done! 🎉
- Your app will be live at: `https://your-app.onrender.com`
- Check `/api/health` to verify

## Environment Variables (Required)

**Copy these to Render:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://[from-neon]
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=[generate-new-secret]
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

**Generate secret:**
```bash
openssl rand -base64 32
```

## Verify Deployment

1. Check health: `https://your-app.onrender.com/api/health`
2. Visit app: `https://your-app.onrender.com`
3. Check Render logs for any errors

## Create First Admin

1. Sign up through the app
2. In Neon SQL Editor, run:
```sql
UPDATE "User" 
SET "role" = 'SUPER_ADMIN', "isSuperAdmin" = true
WHERE email = 'your-email@example.com';
```

## Troubleshooting

**Build fails?**
- Check Render logs
- Verify DATABASE_URL is set
- Ensure all required env vars are present

**Can't connect to DB?**
- Verify Neon connection string
- Ensure `?sslmode=require` is in URL
- Check Neon database is not paused

## Next Steps

- [ ] Configure OAuth (Google, GitHub)
- [ ] Add payment providers (Paystack, PayPal)
- [ ] Set up custom domain
- [ ] Configure email (Resend)

## Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

---

**Need help?** Check Render logs or contact support.
