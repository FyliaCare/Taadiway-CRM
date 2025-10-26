import { z } from "zod";
import { createTRPCRouter, clientProcedure, adminProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";

// Helper to generate unique invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

// Helper to generate unique receipt number
function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${timestamp}-${random}`;
}

export const invoiceRouter = createTRPCRouter({
  // ============================================
  // VENDOR: GENERATE INVOICE FROM DELIVERY REQUEST
  // ============================================
  generateFromDeliveryRequest: clientProcedure
    .input(z.object({ deliveryRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const clientProfile = ctx.clientProfile;

      // Check subscription tier for custom templates
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      // Find delivery request
      const deliveryRequest = await ctx.prisma.deliveryRequest.findFirst({
        where: {
          id: input.deliveryRequestId,
          clientProfileId: clientProfile.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!deliveryRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Check if invoice already exists
      const existingInvoice = await ctx.prisma.invoice.findFirst({
        where: { deliveryRequestId: deliveryRequest.id },
      });

      if (existingInvoice) {
        return existingInvoice;
      }

      // Generate invoice
      const invoiceNumber = generateInvoiceNumber();
      const invoice = await ctx.prisma.invoice.create({
        data: {
          clientProfileId: clientProfile.id,
          deliveryRequestId: deliveryRequest.id,
          invoiceNumber,
          customerName: deliveryRequest.customerName,
          customerEmail: deliveryRequest.customerEmail,
          customerPhone: deliveryRequest.customerPhone,
          customerAddress: deliveryRequest.deliveryAddress,
          subtotal: deliveryRequest.totalAmount,
          totalAmount: deliveryRequest.totalAmount,
          status: "DRAFT",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          items: deliveryRequest.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      });

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          clientProfileId: clientProfile.id,
          type: "INVOICE_GENERATED",
          title: "Invoice Generated",
          message: `Invoice ${invoiceNumber} has been generated for delivery request ${deliveryRequest.requestNumber}`,
          channels: ["EMAIL"],
          status: "PENDING",
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber,
          },
        },
      });

      return invoice;
    }),

  // ============================================
  // VENDOR: GET INVOICE BY ID
  // ============================================
  getById: clientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
        include: {
          deliveryRequest: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          receipts: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return invoice;
    }),

  // ============================================
  // VENDOR: LIST INVOICES
  // ============================================
  list: clientProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
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

      const [invoices, total] = await Promise.all([
        ctx.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            deliveryRequest: {
              select: {
                requestNumber: true,
                customerName: true,
              },
            },
          },
        }),
        ctx.prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // ============================================
  // VENDOR: UPDATE INVOICE STATUS
  // ============================================
  updateStatus: clientProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const updateData: any = { status: input.status };

      if (input.status === "PAID") {
        updateData.paidAt = new Date();
      }

      const updated = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  // ============================================
  // VENDOR: GENERATE RECEIPT FOR INVOICE
  // ============================================
  generateReceipt: clientProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paymentMethod: z.enum([
          "PAYMENT_BEFORE_DELIVERY",
          "PAYMENT_ON_DELIVERY",
          "BANK_TRANSFER",
          "CARD",
          "CASH",
          "MOBILE_MONEY",
        ]),
        amountPaid: z.number().positive(),
        transactionReference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Generate receipt
      const receiptNumber = generateReceiptNumber();
      const receipt = await ctx.prisma.receipt.create({
        data: {
          invoiceId: invoice.id,
          receiptNumber,
          amountPaid: input.amountPaid,
          paymentMethod: input.paymentMethod,
          paymentDate: new Date(),
          notes: input.transactionReference
            ? `Transaction Reference: ${input.transactionReference}`
            : undefined,
        },
      });

      // Mark invoice as paid if full amount received
      if (input.amountPaid >= invoice.totalAmount) {
        await ctx.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          clientProfileId: ctx.clientProfile.id,
          type: "RECEIPT_GENERATED",
          title: "Receipt Generated",
          message: `Receipt ${receiptNumber} has been generated for invoice ${invoice.invoiceNumber}`,
          channels: ["EMAIL"],
          status: "PENDING",
          metadata: {
            receiptId: receipt.id,
            receiptNumber,
            invoiceNumber: invoice.invoiceNumber,
          },
        },
      });

      return receipt;
    }),

  // ============================================
  // VENDOR: GET RECEIPT BY ID
  // ============================================
  getReceipt: clientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const receipt = await ctx.prisma.receipt.findFirst({
        where: {
          id: input.id,
          invoice: {
            clientProfileId: ctx.clientProfile.id,
          },
        },
        include: {
          invoice: {
            include: {
              deliveryRequest: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receipt not found",
        });
      }

      return receipt;
    }),

  // ============================================
  // VENDOR: LIST RECEIPTS
  // ============================================
  listReceipts: clientProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [receipts, total] = await Promise.all([
        ctx.prisma.receipt.findMany({
          where: {
            invoice: {
              clientProfileId: ctx.clientProfile.id,
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        }),
        ctx.prisma.receipt.count({
          where: {
            invoice: {
              clientProfileId: ctx.clientProfile.id,
            },
          },
        }),
      ]);

      return {
        receipts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // ============================================
  // VENDOR: GET INVOICE PDF DATA (for client-side generation)
  // ============================================
  getPdfData: clientProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: {
          id: input.invoiceId,
          clientProfileId: ctx.clientProfile.id,
        },
        include: {
          clientProfile: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Return data needed for PDF generation
      return {
        invoice,
        vendor: {
          businessName: invoice.clientProfile.businessName,
          address: invoice.clientProfile.businessAddress,
        },
      };
    }),

  // ============================================
  // VENDOR: GET RECEIPT PDF DATA (for client-side generation)
  // ============================================
  getReceiptPdfData: clientProcedure
    .input(z.object({ receiptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const receipt = await ctx.prisma.receipt.findFirst({
        where: {
          id: input.receiptId,
          invoice: {
            clientProfileId: ctx.clientProfile.id,
          },
        },
        include: {
          invoice: {
            include: {
              clientProfile: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receipt not found",
        });
      }

      // Return data needed for PDF generation
      return {
        receipt,
        vendor: {
          businessName: receipt.invoice.clientProfile.businessName,
          address: receipt.invoice.clientProfile.businessAddress,
        },
      };
    }),

  // ============================================
  // ADMIN: GET ALL INVOICES
  // ============================================
  adminGetAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
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

      const [invoices, total] = await Promise.all([
        ctx.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            clientProfile: {
              select: {
                businessName: true,
                contactPerson: true,
              },
            },
            deliveryRequest: {
              select: {
                requestNumber: true,
              },
            },
          },
        }),
        ctx.prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});
