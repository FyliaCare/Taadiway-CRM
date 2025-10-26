import { z } from "zod";
import { createTRPCRouter, clientProcedure, adminProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";

// Helper to generate unique delivery request number
function generateRequestNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DR-${timestamp}-${random}`;
}

export const deliveryRequestRouter = createTRPCRouter({
  // ============================================
  // VENDOR: CREATE DELIVERY REQUEST
  // ============================================
  create: clientProcedure
    .input(
      z.object({
        customerName: z.string().min(1, "Customer name is required"),
        customerPhone: z.string().min(1, "Customer phone is required"),
        customerEmail: z.string().email().optional().nullable(),
        deliveryAddress: z.string().min(1, "Delivery address is required"),
        paymentMethod: z.enum([
          "PAYMENT_BEFORE_DELIVERY",
          "PAYMENT_ON_DELIVERY",
          "BANK_TRANSFER",
          "CARD",
          "CASH",
          "MOBILE_MONEY",
        ]),
        scheduledDate: z.date().optional().nullable(),
        preferredTime: z.enum(["morning", "afternoon", "evening"]).optional().nullable(),
        specialInstructions: z.string().optional().nullable(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1, "Quantity must be at least 1"),
          })
        ).min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = ctx.clientProfile;

      // Validate products and calculate total
      const productIds = input.items.map((item) => item.productId);
      const products = await ctx.prisma.product.findMany({
        where: {
          id: { in: productIds },
          clientProfileId: clientProfile.id,
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some products are invalid or not available",
        });
      }

      // Check stock availability
      const stockIssues: string[] = [];
      for (const item of input.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.currentStock < item.quantity) {
          stockIssues.push(
            `${product.name}: requested ${item.quantity}, available ${product.currentStock}`
          );
        }
      }

      if (stockIssues.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient stock: ${stockIssues.join("; ")}`,
        });
      }

      // Calculate total amount
      let totalAmount = 0;
      const itemsWithPrices = input.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const unitPrice = product.unitPrice || 0;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      // Determine initial payment status
      const paymentStatus =
        input.paymentMethod === "PAYMENT_BEFORE_DELIVERY" ? "COMPLETED" : "PENDING";

      // Create delivery request
      const requestNumber = generateRequestNumber();
      const deliveryRequest = await ctx.prisma.deliveryRequest.create({
        data: {
          clientProfileId: clientProfile.id,
          requestNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          deliveryAddress: input.deliveryAddress,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          scheduledDate: input.scheduledDate,
          preferredTime: input.preferredTime,
          specialInstructions: input.specialInstructions,
          totalAmount,
          status: "PENDING_APPROVAL",
          items: {
            create: itemsWithPrices,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create notification for admin
      const adminUsers = await ctx.prisma.user.findMany({
        where: {
          OR: [
            { role: "SUPER_ADMIN" },
            { role: "ADMIN" },
          ],
        },
      });

      for (const admin of adminUsers) {
        await ctx.prisma.notification.create({
          data: {
            userId: admin.id,
            clientProfileId: clientProfile.id,
            type: "DELIVERY_REQUEST_CREATED",
            title: "New Delivery Request",
            message: `${clientProfile.businessName} has created a new delivery request (${requestNumber}) for ${input.customerName}. Total: ${totalAmount.toLocaleString()}`,
            channels: ["EMAIL"],
            status: "PENDING",
            metadata: {
              deliveryRequestId: deliveryRequest.id,
              requestNumber,
              totalAmount,
            },
          },
        });
      }

      // Create notification for vendor
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          clientProfileId: clientProfile.id,
          type: "DELIVERY_REQUEST_CREATED",
          title: "Delivery Request Created",
          message: `Your delivery request (${requestNumber}) for ${input.customerName} has been submitted and is awaiting approval.`,
          channels: ["EMAIL"],
          status: "PENDING",
          metadata: {
            deliveryRequestId: deliveryRequest.id,
            requestNumber,
          },
        },
      });

      return deliveryRequest;
    }),

  // ============================================
  // VENDOR: GET MY DELIVERY REQUESTS
  // ============================================
  getMyRequests: clientProcedure
    .input(
      z.object({
        status: z.enum([
          "PENDING_APPROVAL",
          "APPROVED",
          "REJECTED",
          "SCHEDULED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "FAILED",
          "CANCELLED",
        ]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        clientProfileId: ctx.clientProfile.id,
        ...(status && { status }),
      };

      const [requests, total] = await Promise.all([
        ctx.prisma.deliveryRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    image: true,
                  },
                },
              },
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        }),
        ctx.prisma.deliveryRequest.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // ============================================
  // VENDOR: GET SINGLE DELIVERY REQUEST
  // ============================================
  getById: clientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.deliveryRequest.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          invoices: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      return request;
    }),

  // ============================================
  // VENDOR: CANCEL DELIVERY REQUEST
  // ============================================
  cancel: clientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.deliveryRequest.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Only allow cancellation if not yet dispatched
      if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(request.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a request that is already out for delivery or delivered",
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });

      // Notify admin
      const adminUsers = await ctx.prisma.user.findMany({
        where: {
          OR: [{ role: "SUPER_ADMIN" }, { role: "ADMIN" }],
        },
      });

      for (const admin of adminUsers) {
        await ctx.prisma.notification.create({
          data: {
            userId: admin.id,
            type: "DELIVERY_REQUEST_CREATED",
            title: "Delivery Request Cancelled",
            message: `Delivery request ${request.requestNumber} has been cancelled by the vendor.`,
            channels: ["EMAIL"],
            status: "PENDING",
          },
        });
      }

      return updated;
    }),

  // ============================================
  // ADMIN: GET ALL DELIVERY REQUESTS
  // ============================================
  getAllRequests: adminProcedure
    .input(
      z.object({
        status: z.enum([
          "PENDING_APPROVAL",
          "APPROVED",
          "REJECTED",
          "SCHEDULED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "FAILED",
          "CANCELLED",
        ]).optional(),
        clientProfileId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, clientProfileId } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (clientProfileId) where.clientProfileId = clientProfileId;

      const [requests, total] = await Promise.all([
        ctx.prisma.deliveryRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            clientProfile: {
              select: {
                id: true,
                businessName: true,
                businessType: true,
                contactPerson: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        }),
        ctx.prisma.deliveryRequest.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // ============================================
  // ADMIN: APPROVE DELIVERY REQUEST
  // ============================================
  approve: adminProcedure
    .input(
      z.object({
        id: z.string(),
        scheduledDate: z.date().optional(),
        assignedTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.deliveryRequest.findUnique({
        where: { id: input.id },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (request.status !== "PENDING_APPROVAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending requests can be approved",
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.id },
        data: {
          status: input.scheduledDate ? "SCHEDULED" : "APPROVED",
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date(),
          approvedAt: new Date(),
          scheduledDate: input.scheduledDate,
          assignedTo: input.assignedTo,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Notify vendor
      await ctx.prisma.notification.create({
        data: {
          userId: request.clientProfile.userId,
          clientProfileId: request.clientProfileId,
          type: "DELIVERY_REQUEST_APPROVED",
          title: "Delivery Request Approved",
          message: `Your delivery request (${request.requestNumber}) has been approved${input.scheduledDate
              ? ` and scheduled for ${input.scheduledDate.toLocaleDateString()}`
              : ""
            }.`,
          channels: ["EMAIL", "WHATSAPP"],
          status: "PENDING",
          metadata: {
            deliveryRequestId: request.id,
            requestNumber: request.requestNumber,
          },
        },
      });

      return updated;
    }),

  // ============================================
  // ADMIN: REJECT DELIVERY REQUEST
  // ============================================
  reject: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(1, "Rejection reason is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.deliveryRequest.findUnique({
        where: { id: input.id },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      if (request.status !== "PENDING_APPROVAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending requests can be rejected",
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date(),
          rejectionReason: input.reason,
        },
      });

      // Notify vendor
      await ctx.prisma.notification.create({
        data: {
          userId: request.clientProfile.userId,
          clientProfileId: request.clientProfileId,
          type: "DELIVERY_REQUEST_REJECTED",
          title: "Delivery Request Rejected",
          message: `Your delivery request (${request.requestNumber}) has been rejected. Reason: ${input.reason}`,
          channels: ["EMAIL", "WHATSAPP"],
          status: "PENDING",
          metadata: {
            deliveryRequestId: request.id,
            requestNumber: request.requestNumber,
            rejectionReason: input.reason,
          },
        },
      });

      return updated;
    }),

  // ============================================
  // ADMIN: UPDATE DELIVERY STATUS
  // ============================================
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "SCHEDULED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "FAILED",
        ]),
        deliveryProof: z.string().optional(),
        customerSignature: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.deliveryRequest.findUnique({
        where: { id: input.id },
        include: {
          clientProfile: {
            include: {
              user: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      const updateData: any = {
        status: input.status,
      };

      if (input.status === "OUT_FOR_DELIVERY") {
        updateData.dispatchedAt = new Date();
      }

      if (input.status === "DELIVERED") {
        updateData.deliveredAt = new Date();
        updateData.deliveryProof = input.deliveryProof;
        updateData.customerSignature = input.customerSignature;

        // Mark payment as completed if POD
        if (request.paymentMethod === "PAYMENT_ON_DELIVERY") {
          updateData.paymentStatus = "COMPLETED";
        }

        // Deduct inventory for delivered items
        for (const item of request.items) {
          const newStock = item.product.currentStock - item.quantity;
          await ctx.prisma.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          // Create inventory log
          await ctx.prisma.inventoryLog.create({
            data: {
              productId: item.productId,
              type: "SALE",
              quantity: -item.quantity,
              previousStock: item.product.currentStock,
              newStock,
              reason: `Delivery: ${request.requestNumber}`,
              reference: request.id,
              updatedById: ctx.session.user.id,
            },
          });
        }

        // Create sale record
        await ctx.prisma.sale.create({
          data: {
            clientProfileId: request.clientProfileId,
            saleNumber: request.requestNumber,
            customerName: request.customerName,
            customerPhone: request.customerPhone,
            deliveryAddress: request.deliveryAddress,
            totalAmount: request.totalAmount,
            status: "DELIVERED",
            saleDate: new Date(),
            deliveryDate: new Date(),
            recordedById: ctx.session.user.id,
            items: {
              create: request.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.id },
        data: updateData,
      });

      // Notify vendor
      const notificationMessages = {
        SCHEDULED: "Your delivery has been scheduled",
        OUT_FOR_DELIVERY: "Your delivery is now out for delivery",
        DELIVERED: "Your delivery has been completed",
        FAILED: "Your delivery attempt failed",
      };

      await ctx.prisma.notification.create({
        data: {
          userId: request.clientProfile.userId,
          clientProfileId: request.clientProfileId,
          type: input.status === "DELIVERED" ? "DELIVERY_COMPLETED" : "DELIVERY_DISPATCHED",
          title: "Delivery Status Update",
          message: `${notificationMessages[input.status]} - ${request.requestNumber}`,
          channels: ["EMAIL", "WHATSAPP"],
          status: "PENDING",
          metadata: {
            deliveryRequestId: request.id,
            requestNumber: request.requestNumber,
            newStatus: input.status,
          },
        },
      });

      return updated;
    }),
});
