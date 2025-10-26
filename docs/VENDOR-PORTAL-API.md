# Vendor Portal API Documentation

## Overview

The Vendor Portal API provides endpoints for vendors to view their business performance data after administrators input sales and inventory information. This is designed for Taadiway's warehouse management business model where vendors subscribe to store products and can monitor their performance.

**Access Control**: All vendor endpoints use `clientProcedure` which automatically:
- Requires authentication
- Ensures the user has a client/vendor profile
- Restricts data access to only the logged-in vendor's data

## API Endpoints

### 🎯 Dashboard & Overview

#### `vendor.getDashboard`
Get comprehensive dashboard overview with key metrics.

**Type**: Query  
**Auth**: Required (Vendor)  
**Input**: None

**Returns**:
```typescript
{
  overview: {
    totalProducts: number;        // Total products in warehouse
    activeProducts: number;        // Currently active products
    totalSales: number;           // All-time sales count
    lowStockAlert: number;        // Products below minimum stock
  },
  recentPerformance: {
    salesCount: number;           // Sales in last 30 days
    revenue: number;              // Revenue in last 30 days
    profit: number;               // Profit in last 30 days
  },
  inventory: {
    totalStock: number;           // Total units in warehouse
    lowStockCount: number;        // Low stock items count
  },
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
      sellingPrice: number;
    };
    totalQuantity: number;        // Units sold (last 30 days)
    totalRevenue: number;         // Revenue (last 30 days)
  }>;
  subscription: {
    plan: string;                 // BASIC | STANDARD | PREMIUM
    status: string;               // TRIAL | ACTIVE | EXPIRED | etc.
    endDate: Date;
    autoRenew: boolean;
  };
}
```

**Example Usage**:
```typescript
const dashboard = await trpc.vendor.getDashboard.query();
console.log(`Total Products: ${dashboard.overview.totalProducts}`);
console.log(`Revenue (30d): GH₵${dashboard.recentPerformance.revenue}`);
```

---

### 📦 Product Management

#### `vendor.getMyProducts`
View all products stored in Taadiway warehouse with pagination and filtering.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  page?: number;                  // Default: 1
  limit?: number;                 // Default: 20, Max: 100
  search?: string;                // Search name, SKU, description
  category?: string;              // Filter by category
  stockStatus?: "all" | "in-stock" | "low-stock" | "out-of-stock"; // Default: "all"
  sortBy?: "name" | "sku" | "currentStock" | "createdAt"; // Default: "createdAt"
  sortOrder?: "asc" | "desc";     // Default: "desc"
}
```

**Returns**:
```typescript
{
  products: Array<{
    id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    currentStock: number;
    minStockLevel: number;
    costPrice: number;
    sellingPrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    inventoryLogs: Array<{       // Last 5 inventory updates
      id: string;
      changeType: string;
      quantityChange: number;
      newStock: number;
      notes: string;
      createdAt: Date;
      updatedBy: {
        name: string;
        email: string;
      };
    }>;
    totalSold: number;            // All-time quantity sold
    totalRevenue: number;         // All-time revenue
    stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Example Usage**:
```typescript
// Get low stock products
const lowStock = await trpc.vendor.getMyProducts.query({
  stockStatus: "low-stock",
  sortBy: "currentStock",
  sortOrder: "asc"
});

// Search products
const results = await trpc.vendor.getMyProducts.query({
  search: "soap",
  page: 1,
  limit: 10
});
```

---

#### `vendor.getProductDetails`
Get detailed information about a specific product including full history.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  productId: string;
}
```

**Returns**:
```typescript
{
  product: {
    id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    currentStock: number;
    minStockLevel: number;
    costPrice: number;
    sellingPrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    inventoryLogs: Array<{       // Last 50 inventory updates
      id: string;
      changeType: string;
      quantityChange: number;
      oldStock: number;
      newStock: number;
      notes: string;
      createdAt: Date;
      updatedBy: {
        name: string;
        email: string;
      };
    }>;
    saleItems: Array<{           // Last 20 sales
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      sale: {
        id: string;
        saleDate: Date;
        totalAmount: number;
        recordedBy: {
          name: string;
        };
      };
    }>;
  };
  salesStats: {
    totalQuantitySold: number;
    totalRevenue: number;
    averagePrice: number;
  };
}
```

**Example Usage**:
```typescript
const details = await trpc.vendor.getProductDetails.query({
  productId: "prod_123"
});
console.log(`${details.product.name} - Sold: ${details.salesStats.totalQuantitySold} units`);
```

---

### 💰 Sales & Revenue

#### `vendor.getMySales`
View sales history with filtering and pagination.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  page?: number;                  // Default: 1
  limit?: number;                 // Default: 20, Max: 100
  startDate?: Date;               // Filter by date range
  endDate?: Date;
  sortBy?: "saleDate" | "totalAmount" | "profit"; // Default: "saleDate"
  sortOrder?: "asc" | "desc";     // Default: "desc"
}
```

**Returns**:
```typescript
{
  sales: Array<{
    id: string;
    saleDate: Date;
    totalAmount: number;
    profit: number;
    notes: string;
    createdAt: Date;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku: string;
      };
    }>;
    recordedBy: {
      name: string;
      email: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Example Usage**:
```typescript
// Get last month's sales
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const sales = await trpc.vendor.getMySales.query({
  startDate: lastMonth,
  endDate: new Date(),
  sortBy: "totalAmount",
  sortOrder: "desc"
});
```

---

#### `vendor.getSalesSummary`
Get aggregated sales statistics for a date range.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  startDate?: Date;               // Default: 90 days ago
  endDate?: Date;                 // Default: today
}
```

**Returns**:
```typescript
{
  totalSales: number;             // Number of sales
  totalRevenue: number;           // Total revenue
  totalProfit: number;            // Total profit
  averageSaleAmount: number;      // Average sale value
  dateRange: {
    start: Date;
    end: Date;
  };
}
```

**Example Usage**:
```typescript
const summary = await trpc.vendor.getSalesSummary.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
console.log(`Annual Revenue: GH₵${summary.totalRevenue}`);
```

---

### 📊 Analytics & Insights

#### `vendor.getSalesAnalytics`
Get sales trends and analytics for different time periods.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  period?: "7days" | "30days" | "90days" | "6months" | "1year"; // Default: "30days"
}
```

**Returns**:
```typescript
{
  salesTrend: Array<{
    saleDate: Date;
    _sum: {
      totalAmount: number;
      profit: number;
    };
    _count: number;               // Sales count for that date
  }>;
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
      category: string;
    };
    quantitySold: number;
    revenue: number;
  }>;
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}
```

**Example Usage**:
```typescript
const analytics = await trpc.vendor.getSalesAnalytics.query({
  period: "30days"
});

// Plot chart
analytics.salesTrend.forEach(day => {
  console.log(`${day.saleDate}: GH₵${day._sum.totalAmount}`);
});
```

---

#### `vendor.getRevenueBreakdown`
Get revenue breakdown by product with percentages.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  startDate?: Date;               // Default: 30 days ago
  endDate?: Date;                 // Default: today
}
```

**Returns**:
```typescript
{
  breakdown: Array<{
    product: {
      id: string;
      name: string;
      category: string;
    };
    revenue: number;
    quantity: number;
    percentage: number;           // % of total revenue
  }>;
  totalRevenue: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}
```

**Example Usage**:
```typescript
const breakdown = await trpc.vendor.getRevenueBreakdown.query();
breakdown.breakdown.forEach(item => {
  console.log(`${item.product.name}: GH₵${item.revenue} (${item.percentage.toFixed(1)}%)`);
});
```

---

### 🔔 Notifications & Alerts

#### `vendor.getNotifications`
Get all notifications for the vendor.

**Type**: Query  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  page?: number;                  // Default: 1
  limit?: number;                 // Default: 20, Max: 50
  unreadOnly?: boolean;           // Default: false
}
```

**Returns**:
```typescript
{
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
    read: boolean;
    createdAt: Date;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}
```

**Example Usage**:
```typescript
// Get unread notifications
const unread = await trpc.vendor.getNotifications.query({
  unreadOnly: true
});
console.log(`You have ${unread.pagination.unreadCount} unread notifications`);
```

---

#### `vendor.markNotificationRead`
Mark a specific notification as read.

**Type**: Mutation  
**Auth**: Required (Vendor)

**Input**:
```typescript
{
  notificationId: string;
}
```

**Example Usage**:
```typescript
await trpc.vendor.markNotificationRead.mutate({
  notificationId: "notif_123"
});
```

---

#### `vendor.markAllNotificationsRead`
Mark all notifications as read.

**Type**: Mutation  
**Auth**: Required (Vendor)  
**Input**: None

**Example Usage**:
```typescript
await trpc.vendor.markAllNotificationsRead.mutate();
```

---

#### `vendor.getLowStockAlerts`
Get all products that are below minimum stock level.

**Type**: Query  
**Auth**: Required (Vendor)  
**Input**: None

**Returns**:
```typescript
{
  alerts: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    category: string;
  }>;
  count: number;
}
```

**Example Usage**:
```typescript
const alerts = await trpc.vendor.getLowStockAlerts.query();
if (alerts.count > 0) {
  console.log(`⚠️ ${alerts.count} products are low on stock!`);
  alerts.alerts.forEach(product => {
    console.log(`${product.name}: ${product.currentStock} units (min: ${product.minStockLevel})`);
  });
}
```

---

### 👤 Subscription & Profile

#### `vendor.getMySubscription`
Get vendor's subscription details and payment history.

**Type**: Query  
**Auth**: Required (Vendor)  
**Input**: None

**Returns**:
```typescript
{
  profile: {
    id: string;
    businessName: string;
    businessType: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    status: string;
    createdAt: Date;
    subscription: {
      id: string;
      plan: "BASIC" | "STANDARD" | "PREMIUM";
      status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";
      startDate: Date;
      endDate: Date;
      autoRenew: boolean;
      amount: number;
      payments: Array<{
        id: string;
        amount: number;
        paymentDate: Date;
        paymentMethod: string;
        transactionId: string;
        status: string;
      }>;
    };
  };
  subscription: /* same as above */;
}
```

**Example Usage**:
```typescript
const subscription = await trpc.vendor.getMySubscription.query();
console.log(`Plan: ${subscription.subscription.plan}`);
console.log(`Expires: ${subscription.subscription.endDate}`);
console.log(`Auto-renew: ${subscription.subscription.autoRenew ? 'Yes' : 'No'}`);
```

---

## Complete Implementation Example

Here's a full vendor dashboard implementation:

```typescript
'use client';

import { trpc } from '@/lib/trpc/client';
import { useEffect } from 'react';

export default function VendorDashboard() {
  // Fetch dashboard data
  const { data: dashboard, isLoading } = trpc.vendor.getDashboard.useQuery();
  
  // Fetch low stock alerts
  const { data: alerts } = trpc.vendor.getLowStockAlerts.useQuery();
  
  // Fetch notifications
  const { data: notifications } = trpc.vendor.getNotifications.useQuery({
    unreadOnly: true,
    limit: 5
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={dashboard?.overview.totalProducts || 0}
          icon="📦"
        />
        <StatCard
          title="Revenue (30d)"
          value={`GH₵${dashboard?.recentPerformance.revenue.toLocaleString() || 0}`}
          icon="💰"
        />
        <StatCard
          title="Sales (30d)"
          value={dashboard?.recentPerformance.salesCount || 0}
          icon="📊"
        />
        <StatCard
          title="Low Stock Alerts"
          value={alerts?.count || 0}
          icon="⚠️"
          variant={alerts && alerts.count > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Top Selling Products (30d)</h2>
        <div className="space-y-3">
          {dashboard?.topProducts.map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">GH₵{item.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{item.totalQuantity} units sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {notifications && notifications.pagination.unreadCount > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Unread Notifications</h2>
          <div className="space-y-2">
            {notifications.notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-2 p-3 bg-white rounded">
                <span className="text-xl">🔔</span>
                <div className="flex-1">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg text-white">
        <h2 className="text-xl font-semibold mb-2">Subscription</h2>
        <p className="text-lg">
          {dashboard?.subscription?.plan} Plan - {dashboard?.subscription?.status}
        </p>
        <p className="text-sm opacity-90">
          Expires: {new Date(dashboard?.subscription?.endDate || '').toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, variant = 'default' }: any) {
  const bgColor = variant === 'warning' ? 'bg-orange-50' : 'bg-white';
  const textColor = variant === 'warning' ? 'text-orange-600' : 'text-gray-900';

  return (
    <div className={`${bgColor} p-6 rounded-lg shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
```

---

## Security & Access Control

### Authentication
All vendor endpoints require:
1. Valid user session (NextAuth)
2. User must have a `clientProfile` record
3. User role can be `USER` (vendor) or higher

### Data Isolation
- Vendors can ONLY view their own data
- All queries automatically filter by `clientProfileId`
- Attempting to access another vendor's data returns error

### Example Security Implementation
```typescript
// ✅ SECURE - Vendor can only see their own products
const products = await trpc.vendor.getMyProducts.query();

// ❌ BLOCKED - Vendor cannot access admin endpoints
const allClients = await trpc.client.list.query(); // Returns error if not admin
```

---

## Error Handling

All endpoints may return these errors:

```typescript
// Client profile not found
{
  code: "NOT_FOUND",
  message: "Client profile not found"
}

// Unauthorized access
{
  code: "UNAUTHORIZED",
  message: "You must be logged in"
}

// Access denied
{
  code: "FORBIDDEN",
  message: "Product not found or access denied"
}
```

**Best Practice**:
```typescript
try {
  const dashboard = await trpc.vendor.getDashboard.query();
  // Handle success
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else if (error.code === 'NOT_FOUND') {
    // Show setup instructions
  } else {
    // Show generic error
  }
}
```

---

## Next Steps

1. **Create Vendor Dashboard UI** - Build frontend pages using these endpoints
2. **Set up Real-time Updates** - Use subscriptions for live notifications
3. **Add Export Features** - Allow vendors to export their data
4. **Mobile App** - Use same API for mobile vendor app
5. **Analytics Widgets** - Create reusable chart components

---

## Support

For questions or issues with the Vendor Portal API:
- Contact: 0559 220 442
- Email: support@taadiway.com
