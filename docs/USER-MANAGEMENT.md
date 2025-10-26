# User Management & Role-Based Access Control (RBAC)

## Overview

Taadiway CRM now features a comprehensive user management system with role-based access control. This system ensures that the main super admin account cannot be deleted while allowing controlled delegation of responsibilities to other users.

## User Roles

### 1. **SUPER_ADMIN** 🛡️
- The highest level of access
- **Cannot be deleted or deactivated** (platform safety)
- Full access to all features including:
  - User management (create, edit, delete other users)
  - Complete system settings
  - All administrative functions
  - Can view and manage everything

### 2. **ADMIN** 👨‍💼
- High-level administrative access
- Can be created by Super Admin
- Permissions depend on assigned capabilities
- Can manage users if given permission
- Cannot delete Super Admin accounts

### 3. **MANAGER** 📊
- Mid-level management access
- Can oversee specific departments or functions
- Customizable permissions based on role
- Cannot manage users by default

### 4. **STAFF** 👥
- Standard employee access
- Limited to operational tasks
- Permissions are highly restricted and customizable
- Cannot access administrative functions

### 5. **USER** 🔵
- Basic user/client access
- Access to their own data and portal
- No administrative capabilities

## Granular Permissions

Each admin user can be assigned specific permissions:

### Core Permissions
- ✅ **Manage Clients** - Create, edit, and manage client accounts
- ✅ **Record Sales** - Enter and process sales transactions
- ✅ **Manage Inventory** - Update stock levels and products
- ✅ **Manage Users** - Create and manage system users
- ✅ **View Reports** - Access analytics and reports
- ✅ **Manage Settings** - Modify system settings
- ✅ **Delete Data** - Remove records from system
- ✅ **Manage Payments** - Process payment transactions
- ✅ **Export Data** - Export data to external formats
- ✅ **Manage Products** - Add/edit product catalog
- ✅ **Approve Refunds** - Authorize refund requests

### Advanced Permissions
- **Max Discount Percent** - Maximum discount they can apply
- **Restricted to Clients** - Limit access to specific client accounts

## User Management Features

### Create Users
1. Navigate to **Dashboard > Users**
2. Click "Add New User"
3. Fill in user details:
   - Full Name
   - Email Address
   - Password (min 8 characters)
   - Role (Admin, Manager, Staff)
   - Contact Information
   - Department & Position

4. Assign Permissions:
   - Select checkboxes for allowed actions
   - Set discount limits if applicable
   - Choose client restrictions if needed

5. Click "Create User"

### Edit Users
- Click the edit icon next to any user
- Update their information or permissions
- Save changes
- **Note:** Cannot edit Super Admin accounts

### Deactivate Users
- Click the ban icon to temporarily disable an account
- User cannot login but data is preserved
- Can be reactivated later
- **Note:** Cannot deactivate Super Admin

### Delete Users (Super Admin Only)
- Only Super Admins can permanently delete users
- Click the delete icon
- Confirm deletion
- **Note:** Cannot delete Super Admin accounts or yourself

### Password Reset
- Admins can reset passwords for users they manage
- Select user > Actions > Reset Password
- System generates temporary password
- User should change on next login

## Security Features

### Super Admin Protection
```typescript
// Automatic checks prevent:
❌ Deleting Super Admin accounts
❌ Deactivating Super Admin accounts
❌ Editing Super Admin role
❌ Removing Super Admin permissions
❌ Self-deletion
```

### Permission Verification
Every API endpoint checks:
1. Is user authenticated?
2. Does user have required permission?
3. Is target user protected (Super Admin)?
4. Is action allowed for current role?

### Activity Tracking
- All user actions are logged
- Login history tracked
- IP addresses recorded
- Device information captured
- Audit trail for compliance

## Database Schema

### User Model
```prisma
model User {
  id             String    @id @default(cuid())
  name           String?
  email          String?   @unique
  role           UserRole  @default(USER)
  isActive       Boolean   @default(true)
  isSuperAdmin   Boolean   @default(false)  // Protected flag
  lastLoginAt    DateTime?
  createdById    String?                     // Who created this user
  createdBy      User?     @relation("UserCreatedBy")
  createdUsers   User[]    @relation("UserCreatedBy")
  adminProfile   AdminProfile?
}
```

### AdminProfile Model
```prisma
model AdminProfile {
  id                   String   @id @default(cuid())
  userId               String   @unique
  position             String?
  department           String?
  
  // Granular Permissions
  canManageClients     Boolean  @default(true)
  canRecordSales       Boolean  @default(true)
  canManageInventory   Boolean  @default(true)
  canManageUsers       Boolean  @default(false)
  canViewReports       Boolean  @default(true)
  canManageSettings    Boolean  @default(false)
  canDeleteData        Boolean  @default(false)
  canManagePayments    Boolean  @default(false)
  canExportData        Boolean  @default(true)
  canManageProducts    Boolean  @default(true)
  canApproveRefunds    Boolean  @default(false)
  maxDiscountPercent   Float?   @default(0)
  restrictedToClients  String[] // Client IDs
}
```

## API Endpoints

### User Management (tRPC)

```typescript
// Get current user with permissions
user.current()

// List all users (admin only)
user.list({ role?: "ADMIN" | "MANAGER" | "STAFF", includeInactive: false })

// Create new user (admin only)
user.create({
  name: "John Doe",
  email: "john@example.com",
  password: "securePassword123",
  role: "STAFF",
  permissions: { ... }
})

// Update user (admin only)
user.updateUser({
  userId: "clx...",
  name: "Updated Name",
  permissions: { canManageClients: true }
})

// Delete user (super admin only)
user.delete({ userId: "clx..." })

// Deactivate user (admin only)
user.deactivate({ userId: "clx..." })

// Reset password (admin only)
user.resetPassword({ userId: "clx...", newPassword: "newPass123" })

// Get user permissions
user.getPermissions()
```

## UI Components

### User Management Page
- **Location:** `/dashboard/users`
- **Access:** Super Admin & Admins with `canManageUsers` permission
- **Features:**
  - User listing with filters
  - Search by name/email
  - Role-based filtering
  - Quick stats dashboard
  - Create/Edit modals
  - Delete confirmation
  - Bulk actions (coming soon)

### Settings Page
- **Location:** `/dashboard/settings`
- **Features:**
  - Profile management
  - Security settings
  - Notification preferences
  - Account deletion (disabled for Super Admin)
  - Activity logs
  - Active sessions

## Best Practices

### 1. Principle of Least Privilege
Only grant permissions necessary for the job role:
```typescript
// ❌ Bad - Too many permissions
{ canManageUsers: true, canDeleteData: true, canManageSettings: true }

// ✅ Good - Only what's needed
{ canRecordSales: true, canViewReports: true }
```

### 2. Regular Audit
- Review user permissions quarterly
- Deactivate unused accounts
- Check activity logs for anomalies
- Update roles as responsibilities change

### 3. Strong Passwords
- Minimum 8 characters
- Mix of upper/lower case
- Include numbers
- Special characters recommended
- Force password changes every 90 days

### 4. Two-Factor Authentication
- Enable 2FA for all admin accounts
- Use authenticator apps (not SMS)
- Backup codes stored securely

### 5. Session Management
- Monitor active sessions
- Terminate suspicious sessions
- Automatic timeout after inactivity
- Limit concurrent sessions

## Migration Guide

### Updating Existing Database

```bash
# 1. Update Prisma schema
npm run db:generate

# 2. Apply migrations
npm run db:migrate

# 3. Mark existing admin as super admin (if needed)
# Run in Prisma Studio or database client:
UPDATE "User" 
SET "isSuperAdmin" = true 
WHERE email = 'your-admin@email.com';
```

### Creating First Super Admin

```sql
-- If no super admin exists, create one:
INSERT INTO "User" (
  id, name, email, password, role, "isSuperAdmin", "isActive"
) VALUES (
  'cuid_generated_id',
  'Super Admin',
  'admin@taadiway.com',
  'bcrypt_hashed_password',
  'SUPER_ADMIN',
  true,
  true
);
```

## Troubleshooting

### Cannot access user management
**Issue:** User Management menu not showing

**Solution:**
1. Check user role is SUPER_ADMIN or ADMIN
2. Verify adminProfile.canManageUsers = true
3. Clear browser cache and re-login

### Cannot delete user
**Issue:** Delete button disabled or error

**Reasons:**
- You're not a Super Admin (only they can delete)
- Target user is a Super Admin (protected)
- Trying to delete yourself (prevented)

### Permission denied errors
**Issue:** API returns 403 Forbidden

**Solution:**
1. Check user has required permission
2. Verify adminProfile exists
3. Check isSuperAdmin flag if needed
4. Review audit logs for details

## Future Enhancements

- [ ] Permission templates/presets
- [ ] Role hierarchy management
- [ ] Bulk user import/export
- [ ] Advanced audit logging
- [ ] IP whitelisting
- [ ] Custom role creation
- [ ] Department-based access
- [ ] Time-based permissions
- [ ] Approval workflows
- [ ] Multi-factor authentication

## Support

For issues or questions:
- Check documentation: `/docs/user-management`
- Contact: support@taadiway.com
- Internal: Slack #crm-support

---

**Last Updated:** October 25, 2025
**Version:** 1.0.0
