# 🔐 Render Environment Variables Configuration

Complete list of environment variables to add in your Render Dashboard.

---

## 📍 Where to Add These

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **Taadiway CRM** web service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**
5. Copy and paste variables below

---

## ✅ Required Variables (Must Have)

```bash
# Node Environment
NODE_ENV=production
NODE_VERSION=18.17.0

# Database Connection (from Neon)
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# NextAuth Configuration
NEXTAUTH_URL=https://taadiway-crm.onrender.com
NEXTAUTH_SECRET=REPLACE_WITH_GENERATED_SECRET

# Application URLs
NEXT_PUBLIC_APP_URL=https://taadiway-crm.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM
```

### 🔑 Generate NEXTAUTH_SECRET

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Example output: `xK8vN2mP5qR7sT9uW1yX3zA4bC6dE8fG0hI2jK4lM6n=`

---

## 🔌 Optional Variables

### Google OAuth (If using Google login)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://taadiway-crm.onrender.com/api/auth/callback/google`

---

### GitHub OAuth (If using GitHub login)

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Setup:**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Create OAuth App
3. Add callback URL: `https://taadiway-crm.onrender.com/api/auth/callback/github`

---

### Paystack Payment Integration

```bash
PAYSTACK_SECRET_KEY=sk_live_your_actual_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_key_here
PAYSTACK_CALLBACK_URL=https://taadiway-crm.onrender.com/api/webhooks/paystack
```

**Setup:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Settings → API Keys & Webhooks
3. Copy Live Secret Key and Public Key
4. Add webhook URL in Paystack dashboard

---

### PayPal Payment Integration

```bash
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_MODE=live
```

**Setup:**
1. Go to [PayPal Developer](https://developer.paypal.com)
2. Create Live App
3. Copy Client ID and Secret
4. Set mode to `live` for production (or `sandbox` for testing)

---

### Email Service (Resend)

```bash
RESEND_API_KEY=re_your_actual_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Setup:**
1. Go to [Resend Dashboard](https://resend.com)
2. Create API Key
3. Verify your domain
4. Use verified domain in EMAIL_FROM

---

### Cache Revalidation (Optional)

```bash
REVALIDATION_SECRET=your-random-secret-for-revalidation
```

**Generate:**
```bash
openssl rand -hex 32
```

---

## 🎯 Render Service Settings

### Build & Deploy Settings

```yaml
Build Command:
npm install && npm run production:build

Start Command:
npm run production:start

Auto-Deploy:
Yes (deploys automatically on git push)

Branch:
main
```

---

### Health Check Configuration

```yaml
Health Check Path:
/api/health

Health Check Interval:
30 seconds

Health Check Timeout:
10 seconds
```

---

### Instance Configuration

**Free Tier:**
- Type: Free
- RAM: 512 MB
- Auto-sleep after 15 min inactivity
- ⚠️ Cold starts on wake-up

**Starter Plan ($7/month) - Recommended:**
- Type: Starter
- RAM: 512 MB
- Always-on (no sleep)
- Better performance

**Standard Plan ($25/month):**
- Type: Standard
- RAM: 2 GB
- Horizontal scaling
- Production-grade

---

## 📋 Copy-Paste Template

Copy this template and fill in your values:

```bash
# === REQUIRED ===
NODE_ENV=production
NODE_VERSION=18.17.0
DATABASE_URL=postgresql://[FILL_FROM_NEON]
NEXTAUTH_URL=https://taadiway-crm.onrender.com
NEXTAUTH_SECRET=[GENERATE_WITH_OPENSSL]
NEXT_PUBLIC_APP_URL=https://taadiway-crm.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM

# === OPTIONAL: OAuth ===
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# === OPTIONAL: Payments ===
# PAYSTACK_SECRET_KEY=
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
# PAYSTACK_CALLBACK_URL=https://taadiway-crm.onrender.com/api/webhooks/paystack
# PAYPAL_CLIENT_ID=
# PAYPAL_CLIENT_SECRET=
# NEXT_PUBLIC_PAYPAL_CLIENT_ID=
# PAYPAL_MODE=live

# === OPTIONAL: Email ===
# RESEND_API_KEY=
# EMAIL_FROM=noreply@yourdomain.com

# === OPTIONAL: Cache ===
# REVALIDATION_SECRET=
```

---

## 🔄 After Adding Variables

1. **Save** all environment variables
2. **Manual Deploy** (first time):
   - Go to **Manual Deploy** → **Deploy latest commit**
3. **Auto-deploy** (subsequent):
   - Will auto-deploy on every `git push` to `main` branch

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Health check passing: `curl https://taadiway-crm.onrender.com/api/health`
- [ ] Database connection working
- [ ] Application loads successfully
- [ ] Sign-up/Sign-in works
- [ ] OAuth providers work (if configured)
- [ ] Payment flows work (if configured)

---

## 🐛 Common Issues

### DATABASE_URL Connection Error

**Problem:** Cannot connect to database

**Solutions:**
- Ensure `?sslmode=require` is at end of DATABASE_URL
- Verify Neon database is not paused (free tier)
- Use **pooled connection string** from Neon (recommended)

Example:
```bash
# Regular connection (good)
postgresql://user:pass@host.neon.tech/db?sslmode=require

# Pooled connection (better for Render)
postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require&pgbouncer=true
```

### NEXTAUTH_SECRET Too Short

**Problem:** NextAuth error about secret length

**Solution:**
```bash
# Generate proper length secret
openssl rand -base64 32
```

### OAuth Redirect URI Mismatch

**Problem:** OAuth login fails

**Solution:**
- Update callback URLs in OAuth provider settings
- Format: `https://taadiway-crm.onrender.com/api/auth/callback/[provider]`
- Replace `[provider]` with `google`, `github`, etc.

---

## 🔒 Security Best Practices

✅ **DO:**
- Use strong NEXTAUTH_SECRET (32+ chars)
- Use environment variables (never hardcode)
- Enable SSL in database connection
- Use `live` mode for production payments
- Rotate secrets periodically

❌ **DON'T:**
- Commit secrets to Git
- Share API keys publicly
- Use test/sandbox keys in production
- Expose sensitive data in client-side code

---

## 🆘 Need Help?

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com

**Neon Support:**
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon

---

**🎉 Ready to deploy!**

Once variables are added, click **"Manual Deploy"** in Render dashboard.
