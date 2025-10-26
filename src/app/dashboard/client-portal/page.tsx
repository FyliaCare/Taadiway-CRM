"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { CurrencyDisplay } from "@/components/dashboard";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Crown
} from "lucide-react";
import Link from "next/link";

export default function VendorDashboardPage() {
  const { data: user } = trpc.user.current.useQuery();
  const { data: dashboard, isLoading } = trpc.vendor.getDashboard.useQuery();
  const { data: lowStockAlerts } = trpc.vendor.getLowStockAlerts.useQuery();
  const { data: notifications } = trpc.vendor.getNotifications.useQuery({
    unreadOnly: false,
    page: 1,
    limit: 5
  });

  const isClient = user?.role === "USER";

  if (!isClient) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            This page is only available for vendor accounts.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const subscription = dashboard?.subscription;
  const overview = dashboard?.overview;
  const performance = dashboard?.recentPerformance;
  const inventory = dashboard?.inventory;
  const topProducts = dashboard?.topProducts || [];

  // Calculate plan tier badge
  const getPlanBadge = (plan: string) => {
    const badges = {
      BASIC: { color: "bg-gray-100 text-gray-800", icon: null },
      STANDARD: { color: "bg-blue-100 text-blue-800", icon: null },
      PREMIUM: { color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white", icon: <Crown className="h-3 w-3" /> }
    };
    return badges[plan as keyof typeof badges] || badges.BASIC;
  };

  const planBadge = getPlanBadge(subscription?.plan || 'BASIC');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Vendor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s your business overview
            </p>
          </div>

          {/* Subscription Badge */}
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm ${planBadge.color}`}>
              {planBadge.icon}
              {subscription?.plan || 'BASIC'} Plan
            </div>
            {subscription && subscription.status !== "ACTIVE" && (
              <span className="text-xs text-red-600 font-medium">
                {subscription.status === "EXPIRED" ? "Subscription Expired" : subscription.status}
              </span>
            )}
          </div>
        </div>

        {/* Subscription Warning Banner */}
        {subscription && subscription.status !== "ACTIVE" && (
          <div className={`rounded-xl border-2 p-4 ${subscription.status === "EXPIRED"
              ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50"
              : "border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50"
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-6 w-6 ${subscription.status === "EXPIRED" ? "text-red-600" : "text-yellow-600"
                  }`} />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {subscription.status === "EXPIRED"
                      ? "Your subscription has expired"
                      : `Subscription Status: ${subscription.status}`
                    }
                  </h3>
                  <p className="text-sm text-gray-700">
                    {subscription.endDate &&
                      `${subscription.status === "EXPIRED" ? "Expired on" : "Expires on"}: ${new Date(subscription.endDate).toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
              >
                Renew Now
              </Link>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockAlerts && lowStockAlerts.alerts.length > 0 && (
          <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Low Stock Alert: {lowStockAlerts.count} {lowStockAlerts.count === 1 ? 'product needs' : 'products need'} restocking
                </h3>
                <div className="mt-2 space-y-1">
                  {lowStockAlerts.alerts.slice(0, 3).map((product) => (
                    <p key={product.id} className="text-sm text-gray-700">
                      • <span className="font-medium">{product.name}</span> - Only {product.currentStock} units left (Reorder at {product.reorderLevel})
                    </p>
                  ))}
                  {lowStockAlerts.count > 3 && (
                    <Link href="/dashboard/my-products" className="text-sm text-blue-600 hover:underline block mt-1">
                      View all {lowStockAlerts.count} low stock items →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Products */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500 opacity-10 blur-2xl transition-all group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600">
                  {overview?.activeProducts || 0} active
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.totalProducts || 0}</p>
              {overview && overview.lowStockAlert > 0 && (
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  ⚠ {overview.lowStockAlert} low stock
                </p>
              )}
            </div>
          </div>

          {/* Sales (30d) */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-green-500 opacity-10 blur-2xl transition-all group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-green-100 p-2.5">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Sales (30 days)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{performance?.salesCount || 0}</p>
              <p className="text-xs text-green-600 mt-2 font-medium">
                {overview?.totalSales || 0} all-time
              </p>
            </div>
          </div>

          {/* Revenue (30d) */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-500 opacity-10 blur-2xl transition-all group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-600">Last 30 days</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                <CurrencyDisplay amount={performance?.revenue || 0} />
              </p>
              <p className="text-xs text-green-600 mt-2 font-medium">
                +<CurrencyDisplay amount={performance?.profit || 0} /> profit
              </p>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-purple-500 opacity-10 blur-2xl transition-all group-hover:scale-150"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-purple-100 p-2.5">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600">In stock</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {inventory?.totalStock || 0}
              </p>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                units across all products
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/delivery-requests/new"
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 transition-all hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-500 transition-colors">
                <Truck className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Delivery Request</h3>
                <p className="text-sm text-gray-600">Request delivery authorization</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/calendar"
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 transition-all hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 group-hover:bg-green-500 transition-colors">
                <Calendar className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Calendar</h3>
                <p className="text-sm text-gray-600">Manage delivery schedule</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/reports"
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 transition-all hover:border-purple-500 hover:bg-purple-50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 group-hover:bg-purple-500 transition-colors">
                <FileText className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Generate Report</h3>
                <p className="text-sm text-gray-600">View business analytics</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Selling Products */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Top Selling Products</h2>
                  <p className="text-sm text-muted-foreground">Last 30 days performance</p>
                </div>
                <Link href="/dashboard/my-products" className="text-sm text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {topProducts.length > 0 ? (
                topProducts
                  .filter(item => item.product) // Filter out items with deleted products
                  .map((item, index) => (
                    <div key={item.product!.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.product!.name}</p>
                          <p className="text-sm text-gray-600">
                            SKU: {item.product!.sku} • {item.totalQuantity} units sold
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            <CurrencyDisplay amount={item.totalRevenue} />
                          </p>
                          <p className="text-sm text-gray-600">
                            @<CurrencyDisplay amount={item.product!.unitPrice || 0} />
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No sales data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first delivery request to see insights
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Recent Updates</h2>
                  <p className="text-sm text-muted-foreground">Latest notifications</p>
                </div>
                <Link href="/dashboard/notifications" className="text-sm text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {notifications && notifications.notifications.length > 0 ? (
                notifications.notifications.map((notif) => {
                  const getNotifIcon = (type: string) => {
                    if (type.includes('APPROVED')) return <CheckCircle className="h-5 w-5 text-green-600" />;
                    if (type.includes('REJECTED')) return <XCircle className="h-5 w-5 text-red-600" />;
                    if (type.includes('DELIVERED')) return <Truck className="h-5 w-5 text-blue-600" />;
                    return <Clock className="h-5 w-5 text-gray-600" />;
                  };

                  const isUnread = notif.status === 'PENDING' || notif.status === 'SENT';

                  return (
                    <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;ll see updates here when there&apos;s activity
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

