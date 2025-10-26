# Vendor Portal API - Quick Reference

## 🚀 Getting Started

```typescript
import { trpc } from '@/lib/trpc/client';

// In your component
const { data, isLoading } = trpc.vendor.getDashboard.useQuery();
```

## 📋 All Endpoints

| Endpoint | Purpose | Input | Auth |
|----------|---------|-------|------|
| `getDashboard` | Overview stats & top products | None | Vendor |
| `getMyProducts` | List products with pagination | `{ page, limit, search, category, stockStatus, sortBy, sortOrder }` | Vendor |
| `getProductDetails` | Single product details | `{ productId }` | Vendor |
| `getMySales` | Sales history | `{ page, limit, startDate, endDate, sortBy, sortOrder }` | Vendor |
| `getSalesSummary` | Aggregated sales stats | `{ startDate?, endDate? }` | Vendor |
| `getSalesAnalytics` | Sales trends over time | `{ period }` | Vendor |
| `getRevenueBreakdown` | Revenue by product | `{ startDate?, endDate? }` | Vendor |
| `getNotifications` | Notification list | `{ page, limit, unreadOnly }` | Vendor |
| `markNotificationRead` | Mark as read | `{ notificationId }` | Vendor |
| `markAllNotificationsRead` | Mark all read | None | Vendor |
| `getLowStockAlerts` | Low stock products | None | Vendor |
| `getMySubscription` | Subscription details | None | Vendor |

## 🎯 Common Patterns

### Dashboard Stats
```typescript
const { data: dashboard } = trpc.vendor.getDashboard.useQuery();

// Access data:
dashboard?.overview.totalProducts
dashboard?.recentPerformance.revenue
dashboard?.topProducts[0].product.name
```

### Product List with Filters
```typescript
const { data: products } = trpc.vendor.getMyProducts.useQuery({
  page: 1,
  limit: 20,
  search: 'soap',
  stockStatus: 'low-stock',
  sortBy: 'currentStock',
  sortOrder: 'asc'
});
```

### Sales with Date Range
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { data: sales } = trpc.vendor.getMySales.useQuery({
  startDate: thirtyDaysAgo,
  endDate: new Date(),
  sortBy: 'totalAmount',
  sortOrder: 'desc',
  page: 1,
  limit: 10
});
```

### Analytics Charts
```typescript
const { data: analytics } = trpc.vendor.getSalesAnalytics.useQuery({
  period: '30days' // or '7days', '90days', '6months', '1year'
});

// Chart data:
analytics?.salesTrend.map(day => ({
  date: day.saleDate,
  revenue: day._sum.totalAmount,
  count: day._count
}));
```

### Low Stock Alerts
```typescript
const { data: alerts } = trpc.vendor.getLowStockAlerts.useQuery();

alerts?.alerts.map(product => (
  `${product.name}: ${product.currentStock} / ${product.reorderLevel}`
));
```

## 🔔 Notifications

### Get Unread Only
```typescript
const { data } = trpc.vendor.getNotifications.useQuery({
  unreadOnly: true,
  page: 1,
  limit: 5
});

const unreadCount = data?.pagination.unreadCount;
```

### Mark as Read
```typescript
const markRead = trpc.vendor.markNotificationRead.useMutation();

await markRead.mutateAsync({ notificationId: 'xyz' });
```

## 📊 Revenue Breakdown
```typescript
const { data } = trpc.vendor.getRevenueBreakdown.useQuery({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Pie chart data:
data?.breakdown.map(item => ({
  label: item.product.name,
  value: item.revenue,
  percentage: item.percentage
}));
```

## 👤 Subscription Info
```typescript
const { data } = trpc.vendor.getMySubscription.useQuery();

const plan = data?.subscription?.plan; // BASIC | STANDARD | PREMIUM
const status = data?.subscription?.status; // ACTIVE | TRIAL | EXPIRED
const expiryDate = data?.subscription?.endDate;
const payments = data?.subscription?.payments; // Last 10 payments
```

## 🔒 Security Notes

- All endpoints require authentication
- Vendors can only see their own data
- Data automatically filtered by `clientProfileId`
- No way to access other vendors' information

## 📚 Full Documentation

See `VENDOR-PORTAL-API.md` for:
- Complete TypeScript types
- Detailed examples
- Error handling
- Best practices

## 🎨 Demo Page

Visit `/dashboard/vendor-test` to see:
- All features listed
- Usage examples
- Implementation patterns

## 💡 Tips

1. **Use React Query features:**
   ```typescript
   const { data, isLoading, error, refetch } = trpc.vendor.getDashboard.useQuery();
   ```

2. **Enable/disable queries:**
   ```typescript
   const { data } = trpc.vendor.getMyProducts.useQuery(
     { page: 1, limit: 10 },
     { enabled: isLoggedIn }
   );
   ```

3. **Auto-refetch on interval:**
   ```typescript
   const { data } = trpc.vendor.getDashboard.useQuery(undefined, {
     refetchInterval: 30000 // 30 seconds
   });
   ```

4. **Optimistic updates:**
   ```typescript
   const mutation = trpc.vendor.markNotificationRead.useMutation({
     onSuccess: () => {
       utils.vendor.getNotifications.invalidate();
     }
   });
   ```

## 🚨 Common Issues

### "Client profile not found"
- User is not logged in
- User doesn't have a ClientProfile
- Use admin account to create ClientProfile first

### No data returned
- Check if vendor has products/sales in database
- Verify date filters aren't too restrictive
- Check pagination parameters

### Type errors
- Run `npm run db:generate` to update Prisma types
- Restart TypeScript server in VS Code
- Check tRPC client is properly configured

## 📞 Support

- Documentation: `VENDOR-PORTAL-API.md`
- Summary: `VENDOR-PORTAL-SUMMARY.md`
- Demo: `/dashboard/vendor-test`
- Contact: 0559 220 442
