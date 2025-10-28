# Creating Your First Admin User

## Option 1: Sign Up Through the App (Recommended)

1. Visit: `https://taadiway-crm.onrender.com/auth/signup`
2. Fill in the form:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
   - Confirm Password: (same password)
3. Click "Create account"
4. You'll be automatically signed in

**Note:** First user created gets `ADMIN` role automatically.

---

## Option 2: Promote to Super Admin (After Signing Up)

After creating your account, promote yourself to SUPER_ADMIN:

### Connect to Neon Database:

1. Go to https://console.neon.tech
2. Select your `taadiway-crm` project
3. Click **SQL Editor**

### Run this SQL:

```sql
-- Replace 'your@email.com' with your actual email
UPDATE "User" 
SET 
  "role" = 'SUPER_ADMIN', 
  "isSuperAdmin" = true
WHERE email = 'your@email.com';

-- Verify the update
SELECT id, email, name, role, "isSuperAdmin" 
FROM "User" 
WHERE email = 'your@email.com';
```

---

## What Changed

✅ **New Features:**
- `/auth/signup` - Full signup page with validation
- `/api/auth/signup` - Signup API endpoint
- Password hashing with bcrypt
- Automatic sign-in after signup
- Email uniqueness validation

✅ **OAuth Changes:**
- Removed GitHub OAuth (as requested)
- Kept Google OAuth (functional when configured)
- Need to set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render

✅ **Security:**
- Passwords hashed with bcrypt (10 rounds)
- Minimum 6 characters password requirement
- Duplicate email checking
- Protected against SQL injection (Prisma ORM)

---

## User Roles

After signing up, you can set these roles:

- `SUPER_ADMIN` - Full system access, manage all organizations
- `ADMIN` - Organization admin
- `MANAGER` - Sales/inventory management
- `SALES_REP` - Sales operations
- `VENDOR` - Vendor portal access
- `CLIENT` - Client portal access

---

## Testing the Signup

1. Wait for deployment to complete (~3-5 minutes)
2. Visit: `https://taadiway-crm.onrender.com/auth/signup`
3. Create your account
4. Promote to SUPER_ADMIN using SQL above
5. Sign in and start using the CRM!

---

## Troubleshooting

**"Email already registered"**
- The email is already in the database
- Use a different email or sign in instead

**"Password too short"**
- Password must be at least 6 characters
- Use a stronger password

**"Failed to create account"**
- Check Render logs for errors
- Verify database connection is working
- Check `/api/health` endpoint

---

**Your CRM now has full authentication! 🎉**
