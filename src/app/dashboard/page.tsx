import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/layout";
import { prisma } from "@/lib/prisma";
import {
  PremiumKPICard,
  AnimatedChartCard,
  StatsGrid,
  FormattedKPICard,
  FormattedAnimatedChart,
  RevenueSummaryCards,
  RecentSalesTable,
  RecentDeliveries
} from "@/components/dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      adminProfile: true,
      clientProfile: {
        include: {
          subscription: true,
        },
      },
    },
  });

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const isClient = !!user?.clientProfile;

  // Get comprehensive stats for admin
  let stats = {
    totalClients: 0,
    activeClients: 0,
    trialClients: 0,
    expiredClients: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    todaySales: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  };

  let recentSales: any[] = [];
  let recentClients: any[] = [];
  let topProducts: any[] = [];
  let lowStockProducts: any[] = [];

  if (isAdmin) {
    // Date calculations
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel data fetching for performance
    const [
      totalClients,
      activeClients,
      trialClients,
      expiredClients,
      totalProducts,
      totalSales,
      todaySalesCount,
      revenueData,
      monthlyRevenueData,
      recentSalesData,
      recentClientsData,
      products,
    ] = await Promise.all([
      prisma.clientProfile.count(),
      prisma.clientProfile.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.clientProfile.count({ where: { subscriptionStatus: "TRIAL" } }),
      prisma.clientProfile.count({ where: { subscriptionStatus: "EXPIRED" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.sale.count(),
      prisma.sale.count({ where: { saleDate: { gte: startOfToday } } }),
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      prisma.sale.aggregate({
        where: { saleDate: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.sale.findMany({
        take: 10,
        orderBy: { saleDate: "desc" },
        include: {
          clientProfile: { include: { user: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.clientProfile.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true, _count: { select: { products: true, sales: true } } },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          clientProfile: { include: { user: true } },
          _count: { select: { sales: true } },
        },
      }),
    ]);

    // Calculate low stock products
    lowStockProducts = products
      .filter((p) => p.reorderLevel !== null && p.currentStock <= p.reorderLevel)
      .slice(0, 10);

    // Calculate top selling products
    topProducts = products
      .sort((a, b) => b._count.sales - a._count.sales)
      .slice(0, 5);

    stats = {
      totalClients,
      activeClients,
      trialClients,
      expiredClients,
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      totalSales,
      todaySales: todaySalesCount,
      totalRevenue: revenueData?._sum?.totalAmount ?? 0,
      monthlyRevenue: monthlyRevenueData?._sum?.totalAmount ?? 0,
    };

    recentSales = recentSalesData;
    recentClients = recentClientsData;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Premium Profile Header */}
        <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white shadow-2xl transition-all duration-500 hover:shadow-3xl">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMTgyNyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          </div>

          {/* Gradient Orbs */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 opacity-10 blur-3xl transition-all duration-1000 group-hover:scale-125"></div>
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 opacity-10 blur-3xl transition-all duration-1000 group-hover:scale-125"></div>

          <div className="relative z-10 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side - Profile Info */}
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "Profile"}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500">
                        <span className="text-4xl font-bold text-white">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Status Badge */}
                  <div className="absolute -bottom-2 -right-2 rounded-xl border-4 border-white bg-gradient-to-br from-green-400 to-emerald-500 px-3 py-1 shadow-lg">
                    <span className="text-xs font-bold text-white">ONLINE</span>
                  </div>
                  {/* Role Badge */}
                  {isAdmin && (
                    <div className="absolute -left-2 -top-2 rounded-lg border-2 border-white bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 shadow-lg">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name & Details */}
                <div className="space-y-2">
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent lg:text-4xl">
                      {user?.name || "User"}
                    </h1>
                    {isAdmin && (
                      <span className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 text-xs font-bold text-purple-700 dark:from-purple-900 dark:to-pink-900 dark:text-purple-300">
                        {user?.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                      </span>
                    )}
                    {isClient && (
                      <span className="rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1 text-xs font-bold text-blue-700 dark:from-blue-900 dark:to-cyan-900 dark:text-blue-300">
                        CLIENT
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  {isClient && user?.clientProfile?.businessName && (
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-700">{user.clientProfile.businessName}</p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {user?.email && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Description */}
                  <p className="text-sm text-gray-600">
                    {isAdmin
                      ? "Monitor your delivery business performance in real-time"
                      : isClient
                        ? `Welcome back! Here's your business overview`
                        : "Welcome to Taadiway CRM"
                    }
                  </p>
                </div>
              </div>

              {/* Right Side - Quick Stats & Actions */}
              <div className="flex flex-col gap-4">
                {/* Date & Time Card */}
                <div className="group/card rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-4 shadow-lg transition-all hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-3 shadow-md">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Today</p>
                      <p className="text-lg font-bold text-amber-900">
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-amber-700">
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {isAdmin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3 shadow-md transition-all hover:shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-green-500 p-1.5">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-green-600">Today</p>
                          <p className="text-lg font-bold text-green-900">{stats.todaySales}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 shadow-md transition-all hover:shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-500 p-1.5">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600">Vendors</p>
                          <p className="text-lg font-bold text-blue-900">{stats.activeClients}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Subscription Info */}
                {isClient && user?.clientProfile?.subscription && (
                  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-purple-600">Subscription</p>
                        <p className="text-sm font-bold text-purple-900">{user.clientProfile.subscription.plan}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${user.clientProfile.subscription.status === "ACTIVE"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                        }`}>
                        {user.clientProfile.subscription.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Accent Bar */}
            <div className="absolute bottom-0 left-0 h-2 w-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transition-all duration-700 group-hover:w-full"></div>
          </div>
        </div>

        {isAdmin && (
          <>
            {/* Key Performance Metrics - Premium KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FormattedKPICard
                title="Total Revenue"
                description="All-time earnings from deliveries"
                amount={stats.totalRevenue}
                format="compact-currency"
                subtitleAmount={stats.monthlyRevenue}
                trend="+12.5%"
                trendUp={true}
                icon="DollarSign"
                gradient="from-amber-400 via-orange-400 to-amber-500"
                delay={0}
              />
              <FormattedKPICard
                title="Vendor Clients"
                description="Total registered delivery vendors"
                amount={stats.totalClients}
                format="number"
                subtitle={`${stats.activeClients} active vendors`}
                trend={`+${stats.trialClients}`}
                trendUp={true}
                icon="Store"
                gradient="from-orange-400 via-amber-400 to-yellow-400"
                delay={100}
              />
              <FormattedKPICard
                title="Total Deliveries"
                description="Completed and pending orders"
                amount={stats.totalSales}
                format="number"
                subtitle={`${stats.todaySales} completed today`}
                trend="+8.3%"
                trendUp={true}
                icon="Truck"
                gradient="from-yellow-400 via-amber-400 to-orange-400"
                delay={200}
              />
              <FormattedKPICard
                title="Inventory Items"
                description="Products available for delivery"
                amount={stats.totalProducts}
                format="number"
                subtitle={`${stats.lowStockProducts} low stock alerts`}
                trend={stats.lowStockProducts > 0 ? "-" + stats.lowStockProducts : "+15"}
                trendUp={stats.lowStockProducts === 0}
                icon="Package"
                gradient="from-amber-500 via-orange-400 to-amber-400"
                delay={300}
              />
            </div>

            {/* Animated Performance Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              <AnimatedChartCard
                title="Delivery Performance"
                value={stats.totalSales.toString()}
                change="+8.3% from last month"
                changePositive={true}
                data={[65, 72, 58, 80, 75, 90]}
                labels={["19", "20", "21", "22", "23", "24"]}
                icon="📦"
                gradient="from-amber-400 via-orange-400 to-amber-500"
              />

              <FormattedAnimatedChart
                title="Revenue Trend"
                amount={stats.monthlyRevenue}
                format="compact-currency"
                change="+12.5% this month"
                changePositive={true}
                data={[45, 52, 65, 70, 80, 85]}
                labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]}
                icon="💰"
                gradient="from-orange-400 via-amber-400 to-yellow-400"
              />

              <AnimatedChartCard
                title="Vendor Growth"
                value={stats.activeClients.toString()}
                change="+15 new vendors"
                changePositive={true}
                data={[42, 48, 52, 58, 65, 68]}
                labels={["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
                icon="👥"
                gradient="from-yellow-400 via-amber-400 to-orange-400"
              />
            </div>

            {/* Quick Stats Grid */}
            <StatsGrid
              stats={[
                {
                  label: "Completed",
                  value: stats.todaySales.toString(),
                  icon: "CheckCircle",
                  color: "#10b981",
                },
                {
                  label: "In Progress",
                  value: Math.floor(stats.totalSales * 0.15).toString(),
                  icon: "Clock",
                  color: "#f59e0b",
                },
                {
                  label: "Pending",
                  value: Math.floor(stats.totalSales * 0.05).toString(),
                  icon: "AlertCircle",
                  color: "#3b82f6",
                },
                {
                  label: "Low Stock",
                  value: stats.lowStockProducts.toString(),
                  icon: "AlertTriangle",
                  color: "#ef4444",
                },
              ]}
            />

            {/* Detailed Dashboard Widgets */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Monthly Revenue Overview */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Monthly Revenue</p>
                    <p className="text-xs text-muted-foreground">Track earnings and compare monthly performance</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md border px-3 py-1 text-xs hover:bg-accent">
                      Export
                    </button>
                  </div>
                </div>

                <RevenueSummaryCards
                  totalRevenue={stats.totalRevenue}
                  monthlyRevenue={stats.monthlyRevenue}
                />

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-muted-foreground">Deliveries</span>
                    </div>
                    <p className="text-xl font-bold text-orange-500">{stats.totalSales}</p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                      <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                    <p className="text-xl font-bold text-cyan-500">{stats.todaySales}</p>
                  </div>
                </div>

                {/* Revenue Donut Chart */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="157 251" transform="rotate(-90 50 50)" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="62 251" strokeDashoffset="-157" transform="rotate(-90 50 50)" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="20 251" strokeDashoffset="-219" transform="rotate(-90 50 50)" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="12" strokeDasharray="12 251" strokeDashoffset="-239" transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Growth</p>
                        <p className="text-sm font-bold text-green-600">+12.5%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Distribution */}
              <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
                {/* Animated background gradient */}
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-green-400 via-blue-400 to-orange-400 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Vendor Status</p>
                      <p className="text-xs text-muted-foreground">Subscription breakdown by vendor type</p>
                    </div>
                    <button className="text-2xl text-gray-400 transition-colors hover:text-gray-600">⋮</button>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    {/* Enhanced Donut Chart */}
                    <div className="relative flex items-center justify-center">
                      <div className="relative h-36 w-36">
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-blue-400 to-orange-400 opacity-20 blur-md"></div>

                        <svg className="relative h-full w-full drop-shadow-lg" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle cx="50" cy="50" r="40" fill="#f9fafb" className="dark:fill-gray-800" />

                          {/* Active segment - Green */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#activeGradient)"
                            strokeWidth="10"
                            strokeDasharray={`${(stats.activeClients / stats.totalClients) * 283} 283`}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />

                          {/* Trial segment - Blue */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#trialGradient)"
                            strokeWidth="10"
                            strokeDasharray={`${(stats.trialClients / stats.totalClients) * 283} 283`}
                            strokeDashoffset={`-${(stats.activeClients / stats.totalClients) * 283}`}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />

                          {/* Expired segment - Orange */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#expiredGradient)"
                            strokeWidth="10"
                            strokeDasharray={`${(stats.expiredClients / stats.totalClients) * 283} 283`}
                            strokeDashoffset={`-${((stats.activeClients + stats.trialClients) / stats.totalClients) * 283}`}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />

                          {/* Center label */}
                          <circle cx="50" cy="50" r="35" fill="white" className="dark:fill-gray-900" />
                          <text x="50" y="48" fontSize="10" fill="#9ca3af" textAnchor="middle" className="font-medium">Total</text>
                          <text x="50" y="58" fontSize="16" fill="#111827" textAnchor="middle" className="font-bold dark:fill-white">{stats.totalClients}</text>

                          {/* Gradients */}
                          <defs>
                            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="trialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                            <linearGradient id="expiredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ea580c" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Enhanced Legend */}
                    <div className="flex-1 space-y-3">
                      {/* Active */}
                      <div className="group/item relative overflow-hidden rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-transparent p-3 transition-all hover:border-green-300 hover:shadow-md dark:border-green-900 dark:from-green-950">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">{stats.activeClients}</span>
                            <span className="text-xs text-gray-500">{stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Trial */}
                      <div className="group/item relative overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-transparent p-3 transition-all hover:border-blue-300 hover:shadow-md dark:border-blue-900 dark:from-blue-950">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trial</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{stats.trialClients}</span>
                            <span className="text-xs text-gray-500">{stats.totalClients > 0 ? Math.round((stats.trialClients / stats.totalClients) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Expired */}
                      <div className="group/item relative overflow-hidden rounded-lg border border-orange-100 bg-gradient-to-r from-orange-50 to-transparent p-3 transition-all hover:border-orange-300 hover:shadow-md dark:border-orange-900 dark:from-orange-950">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expired</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-orange-600">{stats.expiredClients}</span>
                            <span className="text-xs text-gray-500">{stats.totalClients > 0 ? Math.round((stats.expiredClients / stats.totalClients) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-green-400 via-blue-400 to-orange-400 transition-all duration-500 group-hover:w-full"></div>
              </div>

              {/* Delivery Performance */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-600">📊</span>
                      <p className="text-sm font-semibold">Delivery Stats</p>
                    </div>
                    <p className="text-xs text-muted-foreground">12-day delivery trends by status</p>
                  </div>
                  <button className="text-2xl">⋮</button>
                </div>

                <div className="mb-2">
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                  <p className="text-xs text-green-600">+8.3% from last month</p>
                </div>

                <div className="mb-2 flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-green-500"></div>
                    <span>Delivered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-blue-600"></div>
                    <span>Processing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-orange-500"></div>
                    <span>Pending</span>
                  </div>
                </div>

                {/* Mini Bar Chart - Delivery Trend */}
                <div className="flex h-24 items-end gap-1">
                  {[65, 72, 58, 80, 75, 68, 82, 78, 85, 72, 88, 90].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5">
                      <div className="bg-green-500 rounded-t" style={{ height: `${height * 0.7}%` }}></div>
                      <div className="bg-blue-600 rounded-t" style={{ height: `${height * 0.2}%` }}></div>
                      <div className="bg-orange-500 rounded-t" style={{ height: `${height * 0.1}%` }}></div>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Oct 19</span>
                  <span>Oct 21</span>
                  <span>Oct 23</span>
                  <span>Oct 24</span>
                </div>
              </div>
            </div>

            {/* Second Row - Operational Metrics */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Delivery Calendar */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Delivery Schedule</h3>
                    <p className="text-xs text-muted-foreground">Monthly calendar view of all deliveries</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-muted-foreground hover:text-foreground">◀</button>
                    <button className="text-muted-foreground hover:text-foreground">▶</button>
                  </div>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">October 2025</p>

                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <div key={day} className="text-muted-foreground">{day}</div>
                  ))}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isToday = day === 24;
                    const isHilit = [7, 9, 17, 21].includes(day);
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm ${isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : isHilit
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 font-medium'
                            : 'hover:bg-accent'
                          }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inventory Channels */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Inventory Flow</h3>
                  <div className="flex gap-2">
                    <button className="text-xs text-muted-foreground">Last 30 days</button>
                  </div>
                </div>

                {/* Stacked Area Chart Simulation */}
                <div className="relative h-48">
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground">
                    <span>75M</span>
                    <span>50M</span>
                    <span>25M</span>
                    <span>0</span>
                  </div>
                  <svg className="h-full w-full pl-8" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.6 }} />
                        <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.6 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.6 }} />
                        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.6 }} />
                        <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.1 }} />
                      </linearGradient>
                    </defs>

                    {/* Layer 4 - Purple */}
                    <path d="M0,140 Q50,138 100,135 T200,130 T300,128 T400,125 L400,150 L0,150 Z" fill="url(#grad4)" />

                    {/* Layer 3 - Violet */}
                    <path d="M0,120 Q50,115 100,110 T200,105 T300,100 T400,95 L400,150 L0,150 Z" fill="url(#grad3)" />

                    {/* Layer 2 - Blue */}
                    <path d="M0,90 Q50,85 100,80 T200,70 T300,65 T400,60 L400,150 L0,150 Z" fill="url(#grad2)" />

                    {/* Layer 1 - Cyan */}
                    <path d="M0,50 Q50,45 100,40 T200,35 T300,30 T400,28 L400,150 L0,150 Z" fill="url(#grad1)" />
                  </svg>
                </div>

                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-cyan-500"></div>
                    <span>Stock In</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-blue-500"></div>
                    <span>Deliveries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-purple-600"></div>
                    <span>Adjustments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-violet-500"></div>
                    <span>Returns</span>
                  </div>
                </div>
              </div>

              {/* Vendor Performance */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Top Vendors</h3>
                    <p className="text-xs text-muted-foreground">Highest performing vendors by sales</p>
                  </div>
                  <button className="text-2xl">⋮</button>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">By sales volume</p>

                <div className="mb-6 flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" className="dark:stroke-gray-700" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#vendorGradient)"
                        strokeWidth="10"
                        strokeDasharray={`${(stats.activeClients / stats.totalClients) * 251} 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="vendorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#10b981' }} />
                          <stop offset="50%" style={{ stopColor: '#3b82f6' }} />
                          <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{((stats.activeClients / stats.totalClients) * 100).toFixed(0)}%</p>
                        <p className="text-xs text-green-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mb-2 text-xs font-medium">Vendor breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    <span className="text-xs flex-1">Active Vendors</span>
                    <span className="text-xs text-muted-foreground">{stats.activeClients} of {stats.totalClients}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    <span className="text-xs flex-1">Trial Period</span>
                    <span className="text-xs text-muted-foreground">{stats.trialClients}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs flex-1">Expired</span>
                    <span className="text-xs text-muted-foreground">{stats.expiredClients}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
                  <span className="text-muted-foreground">Total Products</span>
                  <span className="font-medium">{stats.totalProducts}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Low Stock Items</span>
                  <span className="font-medium text-orange-600">{stats.lowStockProducts}</span>
                </div>
              </div>
            </div>

            {/* Third Row - System & Communication */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Stock Health Gauge - Analog Design */}
              <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl">
                {/* Background Gradient */}
                <div className="absolute rit-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 opacity-5 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Stock Health</h3>
                      <p className="text-xs text-gray-600">Real-time inventory status gauge</p>
                    </div>
                    <button className="text-gray-400 transition-colors hover:text-gray-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center py-6">
                    <div className="relative h-56 w-56">
                      <svg className="h-full w-full" viewBox="0 0 240 240">
                        {/* Outer bezel */}
                        <circle cx="120" cy="120" r="115" fill="url(#bezelGradient)" />
                        <circle cx="120" cy="120" r="110" fill="#1f2937" />

                        {/* Inner gauge face */}
                        <circle cx="120" cy="120" r="105" fill="url(#faceGradient)" />

                        {/* Colored arc segments */}
                        <path
                          d="M 35 120 A 85 85 0 0 1 70 50"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 70 50 A 85 85 0 0 1 120 35"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 120 35 A 85 85 0 0 1 170 50"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 170 50 A 85 85 0 0 1 205 120"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />

                        {/* Tick marks */}
                        {[...Array(11)].map((_, i) => {
                          const angle = -180 + (i * 18);
                          const isMajor = i % 2 === 0;
                          const startR = isMajor ? 92 : 95;
                          const endR = 85;
                          const rad = (angle * Math.PI) / 180;
                          const x1 = 120 + startR * Math.cos(rad);
                          const y1 = 120 + startR * Math.sin(rad);
                          const x2 = 120 + endR * Math.cos(rad);
                          const y2 = 120 + endR * Math.sin(rad);

                          return (
                            <line
                              key={i}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#374151"
                              strokeWidth={isMajor ? "2" : "1"}
                              strokeLinecap="round"
                            />
                          );
                        })}

                        {/* Number labels */}
                        <text x="50" y="128" fontSize="14" fill="#6b7280" fontWeight="600" textAnchor="middle">0</text>
                        <text x="120" y="55" fontSize="14" fill="#6b7280" fontWeight="600" textAnchor="middle">50</text>
                        <text x="190" y="128" fontSize="14" fill="#6b7280" fontWeight="600" textAnchor="middle">100</text>

                        {/* Needle pointer */}
                        <g transform={`rotate(${stats.totalProducts > 0 ? -90 + (((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts) * 180) : -90} 120 120)`} className="transition-transform duration-1000 ease-out">
                          {/* Needle shadow */}
                          <polygon
                            points="120,122 118,120 120,45 122,120"
                            fill="#000000"
                            opacity="0.2"
                          />
                          {/* Needle body */}
                          <polygon
                            points="120,120 117,118 120,40 123,118"
                            fill="url(#needleGradient)"
                            stroke="#1f2937"
                            strokeWidth="1"
                          />
                          {/* Needle tip */}
                          <circle cx="120" cy="40" r="3" fill="#dc2626" />
                        </g>

                        {/* Center hub */}
                        <circle cx="120" cy="120" r="12" fill="url(#hubGradient)" />
                        <circle cx="120" cy="120" r="8" fill="#1f2937" />
                        <circle cx="120" cy="120" r="5" fill="#374151" />

                        {/* Glass reflection effect */}
                        <ellipse cx="120" cy="70" rx="60" ry="40" fill="white" opacity="0.03" />
                        <ellipse cx="100" cy="60" rx="20" ry="15" fill="white" opacity="0.08" />

                        <defs>
                          <linearGradient id="bezelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#9ca3af' }} />
                            <stop offset="50%" style={{ stopColor: '#d1d5db' }} />
                            <stop offset="100%" style={{ stopColor: '#6b7280' }} />
                          </linearGradient>
                          <radialGradient id="faceGradient" cx="50%" cy="50%">
                            <stop offset="0%" style={{ stopColor: '#111827' }} />
                            <stop offset="100%" style={{ stopColor: '#0a0e1a' }} />
                          </radialGradient>
                          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#dc2626' }} />
                            <stop offset="50%" style={{ stopColor: '#ef4444' }} />
                            <stop offset="100%" style={{ stopColor: '#991b1b' }} />
                          </linearGradient>
                          <radialGradient id="hubGradient" cx="30%" cy="30%">
                            <stop offset="0%" style={{ stopColor: '#4b5563' }} />
                            <stop offset="100%" style={{ stopColor: '#1f2937' }} />
                          </radialGradient>
                        </defs>
                      </svg>

                      {/* Digital readout below gauge */}
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 transform">
                        <div className="rounded-lg border-2 border-gray-700 bg-black px-4 py-1.5">
                          <p className="font-mono text-2xl font-bold text-green-400">
                            {(((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom stats */}
                  <div className="mt-8 rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-green-100 p-2">
                          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stats.totalProducts - stats.lowStockProducts}</p>
                          <p className="text-xs text-gray-600">Well-stocked</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-orange-100 p-2">
                          <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stats.lowStockProducts}</p>
                          <p className="text-xs text-gray-600">Low stock</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 transition-all duration-500 group-hover:w-full" />
              </div>

              {/* Vendor Communication */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Vendor Messages</h3>
                    <p className="text-xs text-muted-foreground">Recent vendor interactions & communications</p>
                  </div>
                  <button className="text-muted-foreground">⋮</button>
                </div>

                <div className="mb-4 flex gap-4 border-b text-sm">
                  <button className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600">Recent</button>
                  <button className="pb-2 text-muted-foreground">Unread</button>
                </div>

                <div className="space-y-3">
                  {recentClients.slice(0, 3).map((client, i) => (
                    <div key={client.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {client.businessName.substring(0, 2).toUpperCase()}
                        </div>
                        {client.subscriptionStatus === 'ACTIVE' && (
                          <div className="absolute bottom-0 rit-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{client.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          {client._count.sales} deliveries � {client._count.products} products
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Performance Metrics */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">📈 Performance Metrics</span>
                    </div>
                    <p className="text-xs text-muted-foreground">5-dimension performance analysis</p>
                  </div>
                  <button className="text-2xl">⋮</button>
                </div>

                <div className="mb-4 flex gap-4 border-b text-xs">
                  <button className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600">Overview</button>
                  <button className="pb-2 text-muted-foreground">Details</button>
                </div>

                {/* Performance Radar Chart */}
                <div className="relative flex items-center justify-center">
                  <svg className="h-48 w-48" viewBox="0 0 200 200">
                    {/* Pentagon background */}
                    <polygon
                      points="100,20 180,80 160,160 40,160 20,80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      className="dark:stroke-gray-700"
                    />
                    <polygon
                      points="100,50 150,85 140,140 60,140 50,85"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      className="dark:stroke-gray-700"
                    />

                    {/* Data overlay */}
                    <polygon
                      points="100,30 170,78 148,155 52,150 28,82"
                      fill="#10b981"
                      fillOpacity="0.2"
                      stroke="#10b981"
                      strokeWidth="2"
                    />

                    {/* Points */}
                    <circle cx="100" cy="30" r="4" fill="#10b981" />
                    <circle cx="170" cy="78" r="4" fill="#10b981" />
                    <circle cx="148" cy="155" r="4" fill="#10b981" />
                    <circle cx="52" cy="150" r="4" fill="#10b981" />
                    <circle cx="28" cy="82" r="4" fill="#10b981" />

                    {/* Labels */}
                    <text x="100" y="15" textAnchor="middle" className="text-xs fill-current">Speed</text>
                    <text x="190" y="85" textAnchor="start" className="text-xs fill-current">Accuracy</text>
                    <text x="165" y="175" textAnchor="middle" className="text-xs fill-current">Coverage</text>
                    <text x="35" y="175" textAnchor="middle" className="text-xs fill-current">Cost</text>
                    <text x="10" y="85" textAnchor="end" className="text-xs fill-current">Service</text>
                  </svg>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
                    <p className="text-xs text-muted-foreground">On-Time Delivery</p>
                    <p className="text-lg font-bold text-green-600">94.5%</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                    <p className="text-lg font-bold text-blue-600">2.3h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remove old temperature heatmap and overview income, keep data tables */}

            {/* Main Content Grid - Tables and Lists */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Deliveries */}
              <div className="lg:col-span-2 rounded-lg border bg-card">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Recent Deliveries</h2>
                  <p className="text-sm text-muted-foreground">Latest transactions across all vendors</p>
                </div>
                <div className="p-6">
                  <RecentDeliveries sales={recentSales} />
                  <div className="mt-4 text-center">
                    <a
                      href="/dashboard/sales"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all deliveries →
                    </a>
                  </div>
                </div>
              </div>              {/* Quick Actions */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Quick Actions</h2>
                  <p className="text-sm text-muted-foreground">Frequently used tasks</p>
                </div>
                <div className="p-6 space-y-3">
                  <a
                    href="/dashboard/sales"
                    className="block rounded-md bg-blue-600 p-3 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    📝 Record Delivery
                  </a>
                  <a
                    href="/dashboard/clients"
                    className="block rounded-md border p-3 text-center text-sm font-medium hover:bg-muted"
                  >
                    👥 Add Vendor
                  </a>
                  <a
                    href="/dashboard/products"
                    className="block rounded-md border p-3 text-center text-sm font-medium hover:bg-muted"
                  >
                    📦 Add Product
                  </a>
                  <a
                    href="/dashboard/inventory"
                    className="block rounded-md border p-3 text-center text-sm font-medium hover:bg-muted"
                  >
                    📊 Update Stock
                  </a>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* New Vendors */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Recent Vendors</h2>
                  <p className="text-sm text-muted-foreground">Newest registrations</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {recentClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{client.businessName}</p>
                          <p className="text-xs text-muted-foreground">
                            {client._count.products} products � {client._count.sales} deliveries
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${client.subscriptionStatus === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-950"
                            : client.subscriptionStatus === "TRIAL"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950"
                              : "bg-red-100 text-red-800 dark:bg-red-950"
                            }`}
                        >
                          {client.subscriptionStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <a
                      href="/dashboard/clients"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all vendors →
                    </a>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Most Delivered</h2>
                  <p className="text-sm text-muted-foreground">Top products by volume</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.clientProfile.businessName}
                          </p>
                        </div>
                        <p className="text-xs font-semibold">{product._count.sales} sales</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Stock Alerts</h2>
                  <p className="text-sm text-muted-foreground">Items needing restocking</p>
                </div>
                <div className="p-6">
                  {lowStockProducts.length > 0 ? (
                    <div className="space-y-3">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-md bg-orange-50 dark:bg-orange-950 p-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.clientProfile.businessName}
                            </p>
                          </div>
                          <div className="text-rit">
                            <p className="text-sm font-semibold text-orange-600">
                              {product.currentStock}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Min: {product.reorderLevel}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-center">
                      <p className="text-sm text-green-800 dark:text-green-400">✓ All stock levels good!</p>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <a
                      href="/dashboard/inventory"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View inventory →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isClient && (
          <>
            {/* Client View - Redirect to client portal */}
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="mb-4 text-lg font-semibold">Client Dashboard</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                You have been redirected to the client portal
              </p>
              <a
                href="/dashboard/client-portal"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Client Portal →
              </a>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
