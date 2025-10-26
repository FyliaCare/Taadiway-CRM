"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar
} from "lucide-react";

export default function MySalesPage() {
  const { data: clientProfile, error: profileError } = trpc.client.getCurrent.useQuery();
  const clientProfileId = clientProfile?.id;

  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const { data: sales, isLoading, error: salesError } = trpc.sale.getByClient.useQuery(
    { clientProfileId: clientProfileId!, limit: 100 },
    { enabled: !!clientProfileId }
  );

  if (profileError || salesError) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">Error loading sales data. Please try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter sales by date range
  const filteredSales = sales?.filter((sale) => {
    if (dateRange === "all") return true;
    
    const saleDate = new Date(sale.saleDate);
    const now = new Date();
    const daysAgo = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return saleDate >= cutoffDate;
  }) || [];

  // Calculate analytics from filtered sales
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0;
  const totalSales = filteredSales.length || 0;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Get top selling products from filtered sales
  const productSales = filteredSales.flatMap(sale => sale.items) || [];
  const productStats = productSales.reduce((acc, item) => {
    const key = item.product.name;
    if (!acc[key]) {
      acc[key] = { name: key, quantity: 0, revenue: 0 };
    }
    acc[key].quantity += item.quantity;
    acc[key].revenue += item.totalPrice;
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tit">Sales Analytics</h1>
            <p className="text-muted-foreground">
              Track your sales performance and product analytics
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-md border bg-background px-4 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            </div>
            <p className="mt-2 text-3xl font-bold">?{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
            </div>
            <p className="mt-2 text-3xl font-bold">{totalSales}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium text-muted-foreground">Average Sale</p>
            </div>
            <p className="mt-2 text-3xl font-bold">?{averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {productSales.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Selling Products */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Top Selling Products</h2>
            </div>
            <div className="p-4 space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">?{product.revenue.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No sales data yet
                </p>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filteredSales && filteredSales.length > 0 ? (
                filteredSales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{sale.saleNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customerName || "Customer"} � {sale.items.length} items
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleDateString()} at{" "}
                          {new Date(sale.saleDate).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-rit">
                        <p className="font-semibold">?{sale.totalAmount.toLocaleString()}</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            sale.status === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : sale.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No sales yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sales Table */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">All Sales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Sale #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{sale.saleNumber}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.customerName || "�"}
                      {sale.customerPhone && (
                        <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.items.map(item => (
                        <div key={item.id} className="text-xs">
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ?{sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          sale.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

