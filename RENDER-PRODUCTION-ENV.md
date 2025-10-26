# 🔐 Production Environment Variables for Render

Copy these values into your Render Dashboard → Environment tab

---

## ✅ REQUIRED VARIABLES

```bash
# Node Configuration
NODE_ENV=production
NODE_VERSION=18.17.0

# Database (Neon - EU Central)
DATABASE_URL=postgresql://neondb_owner:npg_VhJb85KQzvOs@ep-shy-smoke-agji0cjd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# NextAuth (GENERATED SECRETS)
NEXTAUTH_URL=https://taadiway-crm.onrender.com
NEXTAUTH_SECRET=t7wdXvPaGIMV937zn7amNJzq9kdFwqz2KjCXZREvvrs=

# Application URLs
NEXT_PUBLIC_APP_URL=https://taadiway-crm.onrender.com
NEXT_PUBLIC_APP_NAME=Taadiway CRM

# Cache Revalidation (GENERATED)
REVALIDATION_SECRET=b49ca0a8e900269048745b2e854bf86d564cd7b852e67f2a9c5a91abd219b73c
```

---

## 📝 INSTRUCTIONS

### 1. Database Setup (Neon)

1. Go to https://console.neon.tech
2. Create new project: **taadiway-crm**
3. Copy the **Pooled Connection String**
4. Replace `[YOUR_NEON_CONNECTION_STRING]` above

Example Neon URL:
```
postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```

### 2. Add to Render

1. Go to https://dashboard.render.com
2. Select your **Taadiway CRM** service
3. Go to **Environment** tab
4. Add each variable above (one by one)
5. Click **Save Changes**

### 3. Deploy

After adding variables:
- Click **Manual Deploy** → **Deploy latest commit**
- Or push to GitHub (auto-deploys)

---

## 🔌 OPTIONAL VARIABLES (Add when needed)

### Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

### GitHub OAuth
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Paystack Payments
```bash
PAYSTACK_SECRET_KEY=sk_live_your_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_key_here
PAYSTACK_CALLBACK_URL=https://taadiway-crm.onrender.com/api/webhooks/paystack
```

### PayPal Payments
```bash
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_MODE=live
```

### Email (Resend)
```bash
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

---

## ✅ Quick Deploy Checklist

- [ ] Create Neon database
- [ ] Copy Neon connection string
- [ ] Update DATABASE_URL above
- [ ] Add all variables to Render
- [ ] Click "Manual Deploy"
- [ ] Verify: `curl https://taadiway-crm.onrender.com/api/health`

---

## 🔒 Security Notes

✅ **Generated Secrets:**
- NEXTAUTH_SECRET: `t7wdXvPaGIMV937zn7amNJzq9kdFwqz2KjCXZREvvrs=`
- REVALIDATION_SECRET: `b49ca0a8e900269048745b2e854bf86d564cd7b852e67f2a9c5a91abd219b73c`

⚠️ **These are cryptographically secure and ready for production use**

❌ **Never commit these to Git** - Already in .gitignore

---

## 🆘 Troubleshooting

**Build fails?**
- Verify NODE_VERSION is set to 18.17.0
- Check DATABASE_URL format includes `?sslmode=require`

**Can't connect to database?**
- Use Neon **pooled** connection string (better for serverless)
- Format: `postgresql://...pooler.neon.tech/...?pgbouncer=true`

**NextAuth errors?**
- Ensure NEXTAUTH_URL matches your Render URL exactly
- No trailing slash in URLs

---

**🎉 Ready to deploy to production!**
