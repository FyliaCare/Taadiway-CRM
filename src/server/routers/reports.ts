import { z } from "zod";
import { createTRPCRouter, clientProcedure, adminProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const reportsRouter = createTRPCRouter({
  // ============================================
  // VENDOR: GET SALES REPORT
  // ============================================
  getSalesReport: clientProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["day", "week", "month", "product", "customer", "paymentMethod"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check subscription tier - STANDARD or PREMIUM for advanced analytics
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      // BASIC tier gets last 30 days only
      if (subscription?.plan === "BASIC") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (input.startDate < thirtyDaysAgo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "BASIC plan allows reports for the last 30 days only. Upgrade to STANDARD or PREMIUM for full history.",
          });
        }
      }

      // STANDARD tier gets last 90 days
      if (subscription?.plan === "STANDARD") {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        if (input.startDate < ninetyDaysAgo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "STANDARD plan allows reports for the last 90 days. Upgrade to PREMIUM for unlimited history.",
          });
        }
      }

      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          deliveredAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: "DELIVERED",
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { deliveredAt: "asc" },
      });

      // Calculate totals
      const totalRevenue = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);
      const totalOrders = deliveries.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group data
      let groupedData: any[] = [];

      if (input.groupBy === "product") {
        const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        deliveries.forEach((delivery) => {
          delivery.items.forEach((item) => {
            const existing = productMap.get(item.productId) || {
              name: item.product.name,
              quantity: 0,
              revenue: 0,
            };
            existing.quantity += item.quantity;
            existing.revenue += item.totalPrice;
            productMap.set(item.productId, existing);
          });
        });
        groupedData = Array.from(productMap.entries()).map(([id, data]) => ({
          productId: id,
          productName: data.name,
          quantity: data.quantity,
          revenue: data.revenue,
        }));
      } else if (input.groupBy === "customer") {
        const customerMap = new Map<string, { name: string; orders: number; revenue: number }>();
        deliveries.forEach((delivery) => {
          const key = delivery.customerPhone;
          const existing = customerMap.get(key) || {
            name: delivery.customerName,
            orders: 0,
            revenue: 0,
          };
          existing.orders += 1;
          existing.revenue += delivery.totalAmount;
          customerMap.set(key, existing);
        });
        groupedData = Array.from(customerMap.entries()).map(([phone, data]) => ({
          customerPhone: phone,
          customerName: data.name,
          orders: data.orders,
          revenue: data.revenue,
        }));
      } else if (input.groupBy === "paymentMethod") {
        const paymentMap = new Map<string, { orders: number; revenue: number }>();
        deliveries.forEach((delivery) => {
          const method = delivery.paymentMethod;
          const existing = paymentMap.get(method) || { orders: 0, revenue: 0 };
          existing.orders += 1;
          existing.revenue += delivery.totalAmount;
          paymentMap.set(method, existing);
        });
        groupedData = Array.from(paymentMap.entries()).map(([method, data]) => ({
          paymentMethod: method,
          orders: data.orders,
          revenue: data.revenue,
        }));
      }

      return {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          period: {
            start: input.startDate,
            end: input.endDate,
          },
        },
        groupedData,
      };
    }),

  // ============================================
  // VENDOR: GET INVENTORY REPORT
  // ============================================
  getInventoryReport: clientProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.prisma.product.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          ...(input.includeInactive ? {} : { isActive: true }),
        },
        include: {
          _count: {
            select: {
              sales: true,
            },
          },
        },
        orderBy: { currentStock: "asc" },
      });

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.unitPrice || 0)), 0);
      const lowStockCount = products.filter((p) => p.currentStock <= (p.reorderLevel || 0)).length;
      const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

      // Stock movement predictions (simple: based on recent sales velocity)
      const predictions = products.map((product) => {
        const salesCount = product._count.sales;
        // Rough estimation: if product has sales, predict days until reorder
        const daysUntilReorder = salesCount > 0 && product.currentStock > 0
          ? Math.floor(product.currentStock / (salesCount / 30))
          : null;

        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.currentStock,
          reorderPoint: product.reorderLevel,
          needsReorder: product.currentStock <= (product.reorderLevel || 0),
          daysUntilReorder,
        };
      });

      return {
        summary: {
          totalProducts,
          totalValue,
          lowStockCount,
          outOfStockCount,
        },
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          reorderPoint: p.reorderLevel,
          unitPrice: p.unitPrice,
          totalValue: p.currentStock * (p.unitPrice || 0),
          salesCount: p._count.sales,
          status: p.currentStock === 0 ? "OUT_OF_STOCK" : p.currentStock <= (p.reorderLevel || 0) ? "LOW_STOCK" : "IN_STOCK",
        })),
        predictions: predictions.filter((p) => p.needsReorder),
      };
    }),

  // ============================================
  // VENDOR: GET CUSTOMER REPORT
  // ============================================
  getCustomerReport: clientProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        minOrders: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          deliveredAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: "DELIVERED",
        },
        orderBy: { deliveredAt: "asc" },
      });

      // Group by customer
      const customerMap = new Map<string, {
        name: string;
        phone: string;
        email: string | null;
        orders: number;
        totalSpent: number;
        averageOrderValue: number;
        lastOrderDate: Date | null;
        paymentReliability: number; // % of PBD orders
      }>();

      deliveries.forEach((delivery) => {
        const key = delivery.customerPhone;
        const existing = customerMap.get(key) || {
          name: delivery.customerName,
          phone: delivery.customerPhone,
          email: delivery.customerEmail,
          orders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          paymentReliability: 0,
        };

        existing.orders += 1;
        existing.totalSpent += delivery.totalAmount;
        existing.lastOrderDate = delivery.deliveredAt;

        if (delivery.paymentMethod === "PAYMENT_BEFORE_DELIVERY") {
          existing.paymentReliability += 1;
        }

        customerMap.set(key, existing);
      });

      // Calculate metrics
      const customers = Array.from(customerMap.values())
        .map((customer) => ({
          ...customer,
          averageOrderValue: customer.totalSpent / customer.orders,
          paymentReliability: (customer.paymentReliability / customer.orders) * 100,
        }))
        .filter((c) => c.orders >= input.minOrders)
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Top customers
      const topCustomers = customers.slice(0, 10);

      return {
        summary: {
          totalCustomers: customers.length,
          totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
          averageCustomerValue: customers.length > 0
            ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
            : 0,
        },
        topCustomers,
        allCustomers: customers,
      };
    }),

  // ============================================
  // VENDOR: GET DELIVERY PERFORMANCE REPORT
  // ============================================
  getDeliveryReport: clientProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
      });

      const totalRequests = deliveries.length;
      const delivered = deliveries.filter((d) => d.status === "DELIVERED").length;
      const failed = deliveries.filter((d) => d.status === "FAILED").length;
      const pending = deliveries.filter((d) => d.status === "PENDING_APPROVAL").length;
      const rejected = deliveries.filter((d) => d.status === "REJECTED").length;

      // Calculate on-time deliveries (scheduled date <= delivered date)
      const onTimeDeliveries = deliveries.filter((d) => {
        if (!d.deliveredAt || !d.scheduledDate) return false;
        return d.deliveredAt <= d.scheduledDate;
      }).length;

      const onTimePercentage = delivered > 0 ? (onTimeDeliveries / delivered) * 100 : 0;
      const successRate = totalRequests > 0 ? (delivered / totalRequests) * 100 : 0;
      const failureRate = totalRequests > 0 ? (failed / totalRequests) * 100 : 0;

      // Average delivery time (from approval to delivery)
      const deliveryTimes = deliveries
        .filter((d) => d.approvedAt && d.deliveredAt)
        .map((d) => {
          const approved = new Date(d.approvedAt!);
          const delivered = new Date(d.deliveredAt!);
          return (delivered.getTime() - approved.getTime()) / (1000 * 60 * 60); // hours
        });

      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
        : 0;

      return {
        summary: {
          totalRequests,
          delivered,
          failed,
          pending,
          rejected,
          successRate,
          failureRate,
          onTimePercentage,
          avgDeliveryTimeHours: avgDeliveryTime,
        },
        statusBreakdown: [
          { status: "DELIVERED", count: delivered },
          { status: "FAILED", count: failed },
          { status: "PENDING_APPROVAL", count: pending },
          { status: "REJECTED", count: rejected },
        ],
      };
    }),

  // ============================================
  // VENDOR: EXPORT REPORT (returns data for Excel/PDF generation)
  // ============================================
  exportReport: clientProcedure
    .input(
      z.object({
        reportType: z.enum(["sales", "inventory", "customer", "delivery"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        format: z.enum(["excel", "pdf"]),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check subscription tier for export formats
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      // BASIC tier gets PDF only
      if (subscription?.plan === "BASIC" && input.format === "excel") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Excel export is available for STANDARD and PREMIUM plans only. BASIC plan supports PDF exports.",
        });
      }

      // Return export metadata (actual file generation happens client-side)
      return {
        reportType: input.reportType,
        format: input.format,
        generatedAt: new Date(),
        fileName: `${input.reportType}-report-${Date.now()}.${input.format === "excel" ? "xlsx" : "pdf"}`,
        plan: subscription?.plan || "BASIC",
      };
    }),

  // ============================================
  // ADMIN: GET COMPREHENSIVE ANALYTICS
  // ============================================
  adminGetAnalytics: adminProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        clientProfileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        deliveredAt: {
          gte: input.startDate,
          lte: input.endDate,
        },
        status: "DELIVERED",
      };

      if (input.clientProfileId) {
        where.clientProfileId = input.clientProfileId;
      }

      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where,
        include: {
          clientProfile: {
            select: {
              businessName: true,
            },
          },
        },
      });

      const totalRevenue = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);
      const totalOrders = deliveries.length;

      // Group by vendor
      const vendorMap = new Map<string, { name: string; orders: number; revenue: number }>();
      deliveries.forEach((delivery) => {
        const key = delivery.clientProfileId;
        const existing = vendorMap.get(key) || {
          name: delivery.clientProfile.businessName,
          orders: 0,
          revenue: 0,
        };
        existing.orders += 1;
        existing.revenue += delivery.totalAmount;
        vendorMap.set(key, existing);
      });

      return {
        summary: {
          totalRevenue,
          totalOrders,
          totalVendors: vendorMap.size,
        },
        vendorPerformance: Array.from(vendorMap.values()).sort((a, b) => b.revenue - a.revenue),
      };
    }),
});
