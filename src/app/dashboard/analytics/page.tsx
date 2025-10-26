import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/layout";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// Lazy load heavy chart components
const ModernAnalyticsHub = dynamic(
  () => import("@/components/dashboard").then(mod => ({ default: mod.ModernAnalyticsHub })),
  {
    loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>,
    ssr: false
  }
);

const AdvancedAnalyticsCharts = dynamic(
  () => import("@/components/analytics").then(mod => ({ default: mod.AdvancedAnalyticsCharts })),
  {
    loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-96"></div>,
    ssr: false
  }
);

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      adminProfile: true,
      clientProfile: true,
    },
  });

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get data for last 12 months for trend analysis
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, "MMM yyyy"),
    };
  });

  // Revenue trend data
  const revenueByMonth = await Promise.all(
    last12Months.map(async ({ start, end, label }) => {
      const revenue = await prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      });

      return {
        month: label,
        revenue: revenue._sum.totalAmount || 0,
        sales: revenue._count,
      };
    })
  );

  // Client growth trend
  const clientsByMonth = await Promise.all(
    last12Months.map(async ({ start, end, label }) => {
      const clients = await prisma.clientProfile.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const activeClients = await prisma.clientProfile.count({
        where: {
          createdAt: {
            lte: end,
          },
          subscriptionStatus: "ACTIVE",
        },
      });

      return {
        month: label,
        newClients: clients,
        activeClients,
      };
    })
  );

  // Top products by revenue and volume
  const topProductsByRevenue = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      totalPrice: true,
      quantity: true,
    },
    orderBy: {
      _sum: {
        totalPrice: "desc",
      },
    },
    take: 10,
  });

  const productIds = topProductsByRevenue.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      clientProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  const topProducts = topProductsByRevenue.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      name: product?.name || "Unknown",
      revenue: item._sum.totalPrice || 0,
      quantity: item._sum.quantity || 0,
      client: product?.clientProfile?.businessName || "N/A",
    };
  });

  // Sales by status
  const salesByStatus = await prisma.sale.groupBy({
    by: ["status"],
    _count: true,
    _sum: {
      totalAmount: true,
    },
  });

  const statusData = salesByStatus.map((item) => ({
    status: item.status,
    count: item._count,
    revenue: item._sum.totalAmount || 0,
  }));

  // Revenue by client
  const revenueByClient = await prisma.sale.groupBy({
    by: ["clientProfileId"],
    _sum: {
      totalAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: "desc",
      },
    },
    take: 10,
  });

  const clientIds = revenueByClient.map((item) => item.clientProfileId);
  const clients = await prisma.clientProfile.findMany({
    where: {
      id: { in: clientIds },
    },
  });

  const clientRevenueData = revenueByClient.map((item) => {
    const client = clients.find((c) => c.id === item.clientProfileId);
    return {
      client: client?.businessName || "Unknown",
      revenue: item._sum.totalAmount || 0,
      salesCount: item._count,
    };
  });

  // Key metrics
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);

  const currentMonthRevenue = await prisma.sale.aggregate({
    where: {
      saleDate: {
        gte: startOfMonth(currentMonth),
        lte: endOfMonth(currentMonth),
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const lastMonthRevenue = await prisma.sale.aggregate({
    where: {
      saleDate: {
        gte: startOfMonth(lastMonth),
        lte: endOfMonth(lastMonth),
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const revenueGrowth = lastMonthRevenue._sum.totalAmount
    ? ((currentMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) / (lastMonthRevenue._sum.totalAmount || 0) * 100
    : 0;

  const totalClients = await prisma.clientProfile.count();
  const activeClients = await prisma.clientProfile.count({
    where: { subscriptionStatus: "ACTIVE" },
  });

  const totalSales = await prisma.sale.count();
  const totalProducts = await prisma.product.count({ where: { isActive: true } });

  const stats = {
    totalSales,
    activeClients,
    totalClients,
    totalRevenue: currentMonthRevenue._sum.totalAmount || 0,
    totalProducts,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tit bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Analytics & Insits
          </h1>
          <p className="mt-1 text-gray-600">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>

        {/* Analytics Hub Section */}
        <ModernAnalyticsHub stats={stats} />

        {/* Advanced Charts Section */}
        <AdvancedAnalyticsCharts
          revenueData={revenueByMonth}
          clientData={clientsByMonth}
          topProducts={topProducts}
          statusData={statusData}
          clientRevenueData={clientRevenueData}
        />
      </div>
    </DashboardLayout>
  );
}
