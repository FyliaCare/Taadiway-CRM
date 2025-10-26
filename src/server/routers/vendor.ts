import { z } from "zod";
import { createTRPCRouter, clientProcedure } from "@/lib/trpc/trpc";

export const vendorRouter = createTRPCRouter({
  // ============================================
  // VENDOR DASHBOARD - Overview Stats
  // ============================================
  
  getDashboard: clientProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    // Calculate revenue from sale items
    const recentSalesData = await ctx.prisma.sale.findMany({
      where: {
        clientProfileId: clientProfile.id,
        saleDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                costPrice: true,
              },
            },
          },
        },
      },
    });

    // Calculate revenue and profit
    let revenue30d = 0;
    let profit30d = 0;
    recentSalesData.forEach((sale) => {
      revenue30d += sale.totalAmount;
      sale.items.forEach((item) => {
        const cost = item.product.costPrice || 0;
        profit30d += (item.unitPrice - cost) * item.quantity;
      });
    });

    // Get all key metrics in parallel
    const [
      totalProducts,
      activeProducts,
      totalSales,
      lowStockProducts,
      topSellingProducts,
      inventoryValue,
      subscriptionInfo,
    ] = await Promise.all([
      // Total products count
      ctx.prisma.product.count({
        where: { clientProfileId: clientProfile.id },
      }),

      // Active products count
      ctx.prisma.product.count({
        where: {
          clientProfileId: clientProfile.id,
          isActive: true,
        },
      }),

      // Total sales count
      ctx.prisma.sale.count({
        where: { clientProfileId: clientProfile.id },
      }),

      // Low stock products (using reorderLevel)
      ctx.prisma.product.findMany({
        where: {
          clientProfileId: clientProfile.id,
          isActive: true,
          reorderLevel: { not: null },
        },
        select: {
          id: true,
          currentStock: true,
          reorderLevel: true,
        },
      }).then((products) => 
        products.filter((p) => p.currentStock <= (p.reorderLevel || 0)).length
      ),

      // Top selling products (last 30 days)
      ctx.prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            clientProfileId: clientProfile.id,
            saleDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),

      // Total inventory value
      ctx.prisma.product.aggregate({
        where: {
          clientProfileId: clientProfile.id,
          isActive: true,
        },
        _sum: {
          currentStock: true,
        },
      }),

      // Subscription info
      ctx.prisma.subscription.findUnique({
        where: { clientProfileId: clientProfile.id },
        select: {
          plan: true,
          status: true,
          endDate: true,
          autoRenew: true,
        },
      }),
    ]);

    // Get product details for top sellers
    const topProductIds = topSellingProducts.map((p) => p.productId);
    const topProducts = await ctx.prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
      },
    });

    const topSellersWithDetails = topSellingProducts.map((item) => {
      const product = topProducts.find((p) => p.id === item.productId);
      return {
        product,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.totalPrice || 0,
      };
    });

    return {
      overview: {
        totalProducts,
        activeProducts,
        totalSales,
        lowStockAlert: lowStockProducts,
      },
      recentPerformance: {
        salesCount: recentSalesData.length,
        revenue: revenue30d,
        profit: profit30d,
      },
      inventory: {
        totalStock: inventoryValue._sum.currentStock || 0,
        lowStockCount: lowStockProducts,
      },
      topProducts: topSellersWithDetails,
      subscription: subscriptionInfo,
    };
  }),

  // ============================================
  // VENDOR PRODUCTS - View all products in warehouse
  // ============================================

  getMyProducts: clientProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        category: z.string().optional(),
        stockStatus: z.enum(["all", "in-stock", "low-stock", "out-of-stock"]).default("all"),
        sortBy: z.enum(["name", "sku", "currentStock", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const { page, limit, search, category, stockStatus, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        clientProfileId: clientProfile.id,
        isActive: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (category && category !== "all") {
        where.category = category;
      }

      // Get total count
      const total = await ctx.prisma.product.count({ where });

      // Get products
      const products = await ctx.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          inventoryLogs: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              updatedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Filter by stock status and get sales data
      let filteredProducts = products;
      if (stockStatus !== "all") {
        filteredProducts = products.filter((product) => {
          const reorderLevel = product.reorderLevel || 0;
          if (stockStatus === "low-stock") {
            return product.currentStock <= reorderLevel && product.currentStock > 0;
          } else if (stockStatus === "out-of-stock") {
            return product.currentStock === 0;
          } else if (stockStatus === "in-stock") {
            return product.currentStock > reorderLevel;
          }
          return true;
        });
      }

      // Get sales data for each product
      const productsWithSales = await Promise.all(
        filteredProducts.map(async (product) => {
          const salesData = await ctx.prisma.saleItem.aggregate({
            where: { productId: product.id },
            _sum: {
              quantity: true,
              totalPrice: true,
            },
          });

          const reorderLevel = product.reorderLevel || 0;
          return {
            ...product,
            totalSold: salesData._sum.quantity || 0,
            totalRevenue: salesData._sum.totalPrice || 0,
            stockStatus:
              product.currentStock === 0
                ? "out-of-stock"
                : product.currentStock <= reorderLevel
                ? "low-stock"
                : "in-stock",
          };
        })
      );

      return {
        products: productsWithSales,
        pagination: {
          total: stockStatus === "all" ? total : filteredProducts.length,
          page,
          limit,
          totalPages: Math.ceil((stockStatus === "all" ? total : filteredProducts.length) / limit),
        },
      };
    }),

  // Get single product details
  getProductDetails: clientProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const product = await ctx.prisma.product.findFirst({
        where: {
          id: input.productId,
          clientProfileId: clientProfile.id,
        },
        include: {
          inventoryLogs: {
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
              updatedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          sales: {
            take: 20,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              sale: {
                select: {
                  saleDate: true,
                  saleNumber: true,
                  customerName: true,
                  totalAmount: true,
                  status: true,
                  recordedBy: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new Error("Product not found or access denied");
      }

      // Calculate sales statistics
      const salesStats = await ctx.prisma.saleItem.aggregate({
        where: { productId: product.id },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        _avg: {
          unitPrice: true,
        },
      });

      return {
        product,
        salesStats: {
          totalQuantitySold: salesStats._sum.quantity || 0,
          totalRevenue: salesStats._sum.totalPrice || 0,
          averagePrice: salesStats._avg.unitPrice || 0,
        },
      };
    }),

  // ============================================
  // VENDOR SALES - View sales history and performance
  // ============================================

  getMySales: clientProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(["saleDate", "totalAmount"]).default("saleDate"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const { page, limit, startDate, endDate, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        clientProfileId: clientProfile.id,
      };

      if (startDate || endDate) {
        where.saleDate = {};
        if (startDate) where.saleDate.gte = startDate;
        if (endDate) where.saleDate.lte = endDate;
      }

      // Get total count
      const total = await ctx.prisma.sale.count({ where });

      // Get sales with profit calculation
      const sales = await ctx.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  costPrice: true,
                },
              },
            },
          },
          recordedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Calculate profit for each sale
      const salesWithProfit = sales.map((sale) => {
        let profit = 0;
        sale.items.forEach((item) => {
          const cost = item.product.costPrice || 0;
          profit += (item.unitPrice - cost) * item.quantity;
        });
        return {
          ...sale,
          profit,
        };
      });

      return {
        sales: salesWithProfit,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get sales summary
  getSalesSummary: clientProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const startDate = input.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || new Date();

      const sales = await ctx.prisma.sale.findMany({
        where: {
          clientProfileId: clientProfile.id,
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true,
                },
              },
            },
          },
        },
      });

      let totalRevenue = 0;
      let totalProfit = 0;
      sales.forEach((sale) => {
        totalRevenue += sale.totalAmount;
        sale.items.forEach((item) => {
          const cost = item.product.costPrice || 0;
          totalProfit += (item.unitPrice - cost) * item.quantity;
        });
      });

      return {
        totalSales: sales.length,
        totalRevenue,
        totalProfit,
        averageSaleAmount: sales.length > 0 ? totalRevenue / sales.length : 0,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),

  // ============================================
  // VENDOR ANALYTICS - Charts and trends
  // ============================================

  getSalesAnalytics: clientProcedure
    .input(
      z.object({
        period: z.enum(["7days", "30days", "90days", "6months", "1year"]).default("30days"),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      // Calculate date range based on period
      const daysMap = {
        "7days": 7,
        "30days": 30,
        "90days": 90,
        "6months": 180,
        "1year": 365,
      };

      const days = daysMap[input.period];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Sales over time with profit calculation
      const salesByDate = await ctx.prisma.sale.groupBy({
        by: ["saleDate"],
        where: {
          clientProfileId: clientProfile.id,
          saleDate: { gte: startDate },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        orderBy: {
          saleDate: "asc",
        },
      });

      // Top products
      const topProducts = await ctx.prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            clientProfileId: clientProfile.id,
            saleDate: { gte: startDate },
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            totalPrice: "desc",
          },
        },
        take: 10,
      });

      // Get product details
      const productIds = topProducts.map((p) => p.productId);
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
        },
      });

      const topProductsWithDetails = topProducts.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          product,
          quantitySold: item._sum.quantity || 0,
          revenue: item._sum.totalPrice || 0,
        };
      });

      return {
        salesTrend: salesByDate,
        topProducts: topProductsWithDetails,
        period: input.period,
        dateRange: {
          start: startDate,
          end: new Date(),
        },
      };
    }),

  // Revenue breakdown
  getRevenueBreakdown: clientProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || new Date();

      // Get all products with their sales
      const products = await ctx.prisma.product.findMany({
        where: {
          clientProfileId: clientProfile.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          category: true,
        },
      });

      const revenueByProduct = await Promise.all(
        products.map(async (product) => {
          const revenue = await ctx.prisma.saleItem.aggregate({
            where: {
              productId: product.id,
              sale: {
                saleDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            _sum: {
              totalPrice: true,
              quantity: true,
            },
          });

          return {
            product,
            revenue: revenue._sum.totalPrice || 0,
            quantity: revenue._sum.quantity || 0,
          };
        })
      );

      // Calculate percentages
      const totalRevenue = revenueByProduct.reduce((sum, item) => sum + item.revenue, 0);

      const revenueWithPercentage = revenueByProduct
        .map((item) => ({
          ...item,
          percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        breakdown: revenueWithPercentage,
        totalRevenue,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),

  // ============================================
  // VENDOR NOTIFICATIONS - Alerts and updates
  // ============================================

  getNotifications: clientProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      const { page, limit, unreadOnly } = input;
      const skip = (page - 1) * limit;

      const where: any = {
        clientProfileId: clientProfile.id,
      };

      if (unreadOnly) {
        where.status = { not: "READ" };
      }

      const total = await ctx.prisma.notification.count({ where });

      const notifications = await ctx.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return {
        notifications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          unreadCount: await ctx.prisma.notification.count({
            where: { ...where, status: { not: "READ" } },
          }),
        },
      };
    }),

  // Mark notification as read
  markNotificationRead: clientProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      return ctx.prisma.notification.updateMany({
        where: {
          id: input.notificationId,
          clientProfileId: clientProfile.id,
        },
        data: {
          status: "READ",
        },
      });
    }),

  // Mark all notifications as read
  markAllNotificationsRead: clientProcedure.mutation(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    return ctx.prisma.notification.updateMany({
      where: {
        clientProfileId: clientProfile.id,
        status: { not: "READ" },
      },
      data: {
        status: "READ",
      },
    });
  }),

  // Get low stock alerts
  getLowStockAlerts: clientProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    const allProducts = await ctx.prisma.product.findMany({
      where: {
        clientProfileId: clientProfile.id,
        isActive: true,
        reorderLevel: { not: null },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        reorderLevel: true,
        category: true,
      },
    });

    const lowStockProducts = allProducts.filter(
      (product) => product.currentStock <= (product.reorderLevel || 0)
    );

    return {
      alerts: lowStockProducts.sort((a, b) => a.currentStock - b.currentStock),
      count: lowStockProducts.length,
    };
  }),

  // ============================================
  // VENDOR SUBSCRIPTION - View subscription details
  // ============================================

  getMySubscription: clientProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { paymentDate: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    return {
      profile: clientProfile,
      subscription: clientProfile.subscription,
    };
  }),
});
