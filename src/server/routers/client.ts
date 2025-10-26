import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, clientProcedure } from "@/lib/trpc/trpc";
import { SubscriptionStatus } from "@prisma/client";

export const clientRouter = createTRPCRouter({
  // Get all clients with advanced filtering and pagination
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.nativeEnum(SubscriptionStatus).optional(),
        businessType: z.string().optional(),
        sortBy: z.enum(["createdAt", "businessName", "subscriptionEnd", "totalSales"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, businessType, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { businessName: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { user: { phone: { contains: search, mode: "insensitive" } } },
        ];
      }

      if (status) {
        where.subscriptionStatus = status;
      }

      if (businessType) {
        where.businessType = { contains: businessType, mode: "insensitive" };
      }

      // Get total count
      const total = await ctx.prisma.clientProfile.count({ where });

      // Build orderBy
      let orderBy: any = {};
      if (sortBy === "totalSales") {
        // For totalSales, we'll sort by sales count in the include
        orderBy = { sales: { _count: sortOrder } };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }

      // Get paginated clients
      const clients = await ctx.prisma.clientProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              whatsappNumber: true,
              isActive: true,
              createdAt: true,
            },
          },
          subscription: {
            select: {
              id: true,
              plan: true,
              amount: true,
              status: true,
              startDate: true,
              endDate: true,
              autoRenew: true,
            },
          },
          _count: {
            select: {
              products: true,
              sales: true,
            },
          },
        },
      });

      // Calculate total revenue for each client
      const clientsWithRevenue = await Promise.all(
        clients.map(async (client) => {
          const revenue = await ctx.prisma.sale.aggregate({
            where: { clientProfileId: client.id },
            _sum: { totalAmount: true },
          });

          return {
            ...client,
            totalRevenue: revenue._sum.totalAmount || 0,
          };
        })
      );

      return {
        clients: clientsWithRevenue,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get all clients (simplified, backward compatible)
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.clientProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsappNumber: true,
          },
        },
        subscription: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          include: {
            inventoryLogs: {
              orderBy: { createdAt: "desc" },
              take: 100,
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
        },
        sales: {
          orderBy: { saleDate: "desc" },
        },
        _count: {
          select: {
            products: true,
            sales: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get single client by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.clientProfile.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          subscription: {
            include: {
              payments: {
                orderBy: { paymentDate: "desc" },
                take: 5,
              },
            },
          },
          products: {
            where: { isActive: true },
          },
          sales: {
            orderBy: { saleDate: "desc" },
            take: 10,
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    }),

  // Get current client profile (for logged-in clients)
  getCurrent: clientProcedure.query(async ({ ctx }) => {
    // clientProcedure already fetches the profile, but we need to include relations
    return ctx.prisma.clientProfile.findUnique({
      where: { id: ctx.clientProfile.id },
      include: {
        user: true,
        subscription: true,
      },
    });
  }),

  // Create new client
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        password: z.string().min(6),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        businessName: z.string(),
        businessType: z.string().optional(),
        businessAddress: z.string().optional(),
        notifyByEmail: z.boolean().default(true),
        notifyByWhatsApp: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(input.password, 10);

      return ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
          phone: input.phone,
          whatsappNumber: input.whatsappNumber,
          role: "USER",
          clientProfile: {
            create: {
              businessName: input.businessName,
              businessType: input.businessType,
              businessAddress: input.businessAddress,
              notifyByEmail: input.notifyByEmail,
              notifyByWhatsApp: input.notifyByWhatsApp,
              subscriptionStatus: "TRIAL",
              subscriptionStart: new Date(),
              subscriptionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
            },
          },
        },
        include: {
          clientProfile: true,
        },
      });
    }),

  // Update client
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        businessAddress: z.string().optional(),
        contactPerson: z.string().optional(),
        notifyByEmail: z.boolean().optional(),
        notifyByWhatsApp: z.boolean().optional(),
        subscriptionStatus: z.nativeEnum(SubscriptionStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Check if user is admin or the client themselves
      const isAdmin = ctx.session.user.role === "ADMIN" || ctx.session.user.role === "SUPER_ADMIN";
      
      if (!isAdmin) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== id) {
          throw new Error("Access denied: You can only update your own profile");
        }

        // Clients cannot change their subscription status
        if (data.subscriptionStatus) {
          delete data.subscriptionStatus;
        }
      }

      return ctx.prisma.clientProfile.update({
        where: { id },
        data,
        include: {
          user: true,
          subscription: true,
        },
      });
    }),

  // Delete client (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the client profile to find the user ID
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!clientProfile) {
        throw new Error("Client not found");
      }

      // Delete the user (this will cascade delete the client profile)
      return ctx.prisma.user.delete({
        where: { id: clientProfile.userId },
      });
    }),

  // Suspend/Activate client
  toggleStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(SubscriptionStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.clientProfile.update({
        where: { id: input.id },
        data: {
          subscriptionStatus: input.status,
        },
      });
    }),

  // Bulk operations
  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        status: z.nativeEnum(SubscriptionStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.clientProfile.updateMany({
        where: {
          id: { in: input.ids },
        },
        data: {
          subscriptionStatus: input.status,
        },
      });
    }),

  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      // Get all user IDs associated with these client profiles
      const clientProfiles = await ctx.prisma.clientProfile.findMany({
        where: { id: { in: input.ids } },
        select: { userId: true },
      });

      const userIds = clientProfiles.map((cp) => cp.userId);

      // Delete all users (cascade will delete client profiles)
      return ctx.prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }),

  // Get client statistics (with access control)
  getStats: protectedProcedure
    .input(z.object({ clientProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      // If user is client, verify they can only see their own stats
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied: You can only view your own statistics");
        }
      }

      const [totalProducts, totalSales, activeProducts, recentSales] =
        await Promise.all([
          ctx.prisma.product.count({
            where: { clientProfileId: input.clientProfileId },
          }),
          ctx.prisma.sale.count({
            where: { clientProfileId: input.clientProfileId },
          }),
          ctx.prisma.product.count({
            where: {
              clientProfileId: input.clientProfileId,
              isActive: true,
            },
          }),
          ctx.prisma.sale.aggregate({
            where: {
              clientProfileId: input.clientProfileId,
              saleDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            _sum: {
              totalAmount: true,
            },
            _count: true,
          }),
        ]);

      return {
        totalProducts,
        totalSales,
        activeProducts,
        recentSalesCount: recentSales._count,
        recentSalesRevenue: recentSales._sum.totalAmount || 0,
      };
    }),

  // Get comprehensive analytics for a client
  getAnalytics: protectedProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Access control
      const isClient = ctx.session.user.role === "USER";
      if (isClient) {
        const clientProfile = await ctx.prisma.clientProfile.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (!clientProfile || clientProfile.id !== input.clientProfileId) {
          throw new Error("Access denied");
        }
      }

      const startDate = input.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || new Date();

      // Sales analytics
      const salesData = await ctx.prisma.sale.groupBy({
        by: ["saleDate"],
        where: {
          clientProfileId: input.clientProfileId,
          saleDate: { gte: startDate, lte: endDate },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        orderBy: { saleDate: "asc" },
      });

      // Top products
      const topProducts = await ctx.prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: {
            clientProfileId: input.clientProfileId,
            saleDate: { gte: startDate, lte: endDate },
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

      // Get product details for top products
      const productIds = topProducts.map((p) => p.productId);
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      });

      const topProductsWithDetails = topProducts.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          ...item,
          product,
        };
      });

      // Inventory status
      const inventoryStatus = await ctx.prisma.product.groupBy({
        by: ["category"],
        where: {
          clientProfileId: input.clientProfileId,
          isActive: true,
        },
        _sum: {
          currentStock: true,
        },
        _avg: {
          currentStock: true,
        },
        _count: true,
      });

      // Revenue metrics
      const totalRevenue = await ctx.prisma.sale.aggregate({
        where: {
          clientProfileId: input.clientProfileId,
          saleDate: { gte: startDate, lte: endDate },
        },
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
        _count: true,
      });

      // Low stock alerts - find products with low stock
      const lowStockProducts = await ctx.prisma.product.findMany({
        where: {
          clientProfileId: input.clientProfileId,
          isActive: true,
          currentStock: { lte: 10 }, // Consider stock <= 10 as low
        },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
        },
        take: 20,
      });

      return {
        salesData,
        topProducts: topProductsWithDetails,
        inventoryStatus,
        totalRevenue: {
          total: totalRevenue._sum?.totalAmount || 0,
          average: totalRevenue._avg?.totalAmount || 0,
          count: totalRevenue._count,
        },
        lowStockProducts,
      };
    }),

  // Get client activity timeline
  getActivity: adminProcedure
    .input(
      z.object({
        clientProfileId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const [sales, products, inventoryLogs] = await Promise.all([
        ctx.prisma.sale.findMany({
          where: { clientProfileId: input.clientProfileId },
          orderBy: { saleDate: "desc" },
          take: input.limit,
          select: {
            id: true,
            saleDate: true,
            totalAmount: true,
            recordedBy: { select: { name: true } },
          },
        }),
        ctx.prisma.product.findMany({
          where: { clientProfileId: input.clientProfileId },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        }),
        ctx.prisma.inventoryLog.findMany({
          where: {
            product: { clientProfileId: input.clientProfileId },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            type: true,
            createdAt: true,
            product: { select: { name: true } },
            updatedBy: { select: { name: true } },
          },
        }),
      ]);

      // Combine and sort by date
      const activities = [
        ...sales.map((s) => ({
          type: "sale" as const,
          date: s.saleDate,
          description: `Sale of ₵${s.totalAmount}`,
          user: s.recordedBy?.name,
        })),
        ...products.map((p) => ({
          type: "product" as const,
          date: p.createdAt,
          description: `Product added: ${p.name}`,
          user: null,
        })),
        ...inventoryLogs.map((l) => ({
          type: "inventory" as const,
          date: l.createdAt,
          description: `${l.type}: ${l.product.name}`,
          user: l.updatedBy?.name,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      return activities.slice(0, input.limit);
    }),

  // Export client data
  exportData: adminProcedure
    .input(z.object({ clientProfileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const clientData = await ctx.prisma.clientProfile.findUnique({
        where: { id: input.clientProfileId },
        include: {
          user: true,
          products: {
            include: {
              inventoryLogs: {
                include: {
                  updatedBy: { select: { name: true, email: true } },
                },
              },
            },
          },
          sales: {
            include: {
              items: {
                include: {
                  product: { select: { name: true, sku: true } },
                },
              },
              recordedBy: { select: { name: true, email: true } },
            },
          },
          subscription: {
            include: {
              payments: true,
            },
          },
        },
      });

      return clientData;
    }),

  // Get subscription overview for all clients
  getSubscriptionOverview: adminProcedure.query(async ({ ctx }) => {
    const statuses = await ctx.prisma.clientProfile.groupBy({
      by: ["subscriptionStatus"],
      _count: true,
    });

    const expiringSoon = await ctx.prisma.clientProfile.count({
      where: {
        subscriptionEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
    });

    const totalRevenue = await ctx.prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
    });

    return {
      byStatus: statuses,
      expiringIn7Days: expiringSoon,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayments: totalRevenue._count,
    };
  }),
});
