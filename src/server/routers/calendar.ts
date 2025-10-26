import { z } from "zod";
import { createTRPCRouter, clientProcedure, adminProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { DeliveryStatus } from "@prisma/client";

export const calendarRouter = createTRPCRouter({
  // ============================================
  // VENDOR: GET CALENDAR EVENTS (scheduled deliveries)
  // ============================================
  getEvents: clientProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check subscription tier - STANDARD or PREMIUM only
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (!subscription || subscription.plan === "BASIC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Calendar scheduling is available for STANDARD and PREMIUM plans only. Upgrade to access this feature.",
        });
      }

      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          scheduledDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: {
            in: ["APPROVED", "SCHEDULED", "OUT_FOR_DELIVERY"],
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          assignedToUser: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledDate: "asc" },
      });

      // Transform to calendar events
      const events = deliveries.map((delivery) => ({
        id: delivery.id,
        title: `Delivery: ${delivery.customerName}`,
        date: delivery.scheduledDate,
        time: delivery.preferredTime,
        status: delivery.status,
        address: delivery.deliveryAddress,
        totalAmount: delivery.totalAmount,
        itemCount: delivery.items.length,
        assignedTo: delivery.assignedToUser?.name,
        color: getStatusColor(delivery.status),
      }));

      return events;
    }),

  // ============================================
  // VENDOR: SCHEDULE DELIVERY
  // ============================================
  scheduleDelivery: clientProcedure
    .input(
      z.object({
        deliveryRequestId: z.string(),
        scheduledDate: z.date(),
        preferredTime: z.enum(["morning", "afternoon", "evening"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription tier
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (!subscription || subscription.plan === "BASIC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Calendar scheduling is available for STANDARD and PREMIUM plans only.",
        });
      }

      const deliveryRequest = await ctx.prisma.deliveryRequest.findFirst({
        where: {
          id: input.deliveryRequestId,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!deliveryRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Only approved requests can be scheduled
      if (deliveryRequest.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only approved delivery requests can be scheduled",
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.deliveryRequestId },
        data: {
          scheduledDate: input.scheduledDate,
          preferredTime: input.preferredTime,
          status: "SCHEDULED",
        },
      });

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          clientProfileId: ctx.clientProfile.id,
          type: "DELIVERY_SCHEDULED",
          title: "Delivery Scheduled",
          message: `Delivery ${deliveryRequest.requestNumber} has been scheduled for ${input.scheduledDate.toLocaleDateString()} (${input.preferredTime})`,
          channels: ["EMAIL"],
          status: "PENDING",
        },
      });

      return updated;
    }),

  // ============================================
  // VENDOR: GET AVAILABLE TIME SLOTS
  // ============================================
  getAvailableSlots: clientProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      // Check subscription tier
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (!subscription || subscription.plan === "BASIC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Calendar scheduling is available for STANDARD and PREMIUM plans only.",
        });
      }

      // Get all scheduled deliveries for this date
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const scheduledDeliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ["SCHEDULED", "OUT_FOR_DELIVERY"],
          },
        },
        select: {
          preferredTime: true,
        },
      });

      // Count deliveries per time slot
      const slots: Record<string, number> = {
        morning: 0,
        afternoon: 0,
        evening: 0,
      };

      scheduledDeliveries.forEach((delivery) => {
        if (delivery.preferredTime) {
          slots[delivery.preferredTime]++;
        }
      });

      // Define capacity per slot (can be made configurable)
      const SLOT_CAPACITY = 5;

      return [
        {
          time: "morning",
          label: "Morning (8AM - 12PM)",
          available: SLOT_CAPACITY - slots.morning,
          capacity: SLOT_CAPACITY,
          isAvailable: slots.morning < SLOT_CAPACITY,
        },
        {
          time: "afternoon",
          label: "Afternoon (12PM - 5PM)",
          available: SLOT_CAPACITY - slots.afternoon,
          capacity: SLOT_CAPACITY,
          isAvailable: slots.afternoon < SLOT_CAPACITY,
        },
        {
          time: "evening",
          label: "Evening (5PM - 9PM)",
          available: SLOT_CAPACITY - slots.evening,
          capacity: SLOT_CAPACITY,
          isAvailable: slots.evening < SLOT_CAPACITY,
        },
      ];
    }),

  // ============================================
  // VENDOR: RESCHEDULE DELIVERY
  // ============================================
  reschedule: clientProcedure
    .input(
      z.object({
        deliveryRequestId: z.string(),
        newDate: z.date(),
        newTime: z.enum(["morning", "afternoon", "evening"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription tier
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (!subscription || subscription.plan === "BASIC") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Calendar scheduling is available for STANDARD and PREMIUM plans only.",
        });
      }

      const deliveryRequest = await ctx.prisma.deliveryRequest.findFirst({
        where: {
          id: input.deliveryRequestId,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!deliveryRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery request not found",
        });
      }

      // Can't reschedule if already out for delivery or completed
      if (["OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"].includes(deliveryRequest.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reschedule a delivery that is already dispatched or completed",
        });
      }

      const updated = await ctx.prisma.deliveryRequest.update({
        where: { id: input.deliveryRequestId },
        data: {
          scheduledDate: input.newDate,
          preferredTime: input.newTime,
        },
      });

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.session.user.id,
          clientProfileId: ctx.clientProfile.id,
          type: "DELIVERY_SCHEDULED",
          title: "Delivery Rescheduled",
          message: `Delivery ${deliveryRequest.requestNumber} has been rescheduled to ${input.newDate.toLocaleDateString()} (${input.newTime})`,
          channels: ["EMAIL"],
          status: "PENDING",
        },
      });

      return updated;
    }),

  // ============================================
  // VENDOR: CHECK FOR SCHEDULING CONFLICTS
  // ============================================
  getConflicts: clientProcedure
    .input(
      z.object({
        date: z.date(),
        time: z.enum(["morning", "afternoon", "evening"]),
        area: z.string().optional(), // Optional: delivery area for proximity check
      })
    )
    .query(async ({ ctx, input }) => {
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const deliveries = await ctx.prisma.deliveryRequest.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          preferredTime: input.time,
          status: {
            in: ["SCHEDULED", "OUT_FOR_DELIVERY"],
          },
        },
        select: {
          id: true,
          requestNumber: true,
          customerName: true,
          deliveryAddress: true,
          preferredTime: true,
        },
      });

      // If area is provided, filter for proximity conflicts
      const conflicts = input.area
        ? deliveries.filter((d) =>
            d.deliveryAddress.toLowerCase().includes(input.area!.toLowerCase())
          )
        : deliveries;

      return {
        hasConflicts: conflicts.length > 0,
        count: conflicts.length,
        conflicts: conflicts.map((d) => ({
          id: d.id,
          requestNumber: d.requestNumber,
          customerName: d.customerName,
          address: d.deliveryAddress,
        })),
      };
    }),

  // ============================================
  // ADMIN: GET ALL SCHEDULED DELIVERIES
  // ============================================
  adminGetAll: adminProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        clientProfileId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        scheduledDate: {
          gte: input.startDate,
          lte: input.endDate,
        },
        status: {
          in: ["SCHEDULED", "OUT_FOR_DELIVERY"],
        },
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
              contactPerson: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          assignedToUser: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledDate: "asc" },
      });

      return deliveries;
    }),
});

// Helper function to get color based on status
function getStatusColor(status: DeliveryStatus): string {
  const colors: Record<DeliveryStatus, string> = {
    PENDING_APPROVAL: "#FFA500", // Orange
    APPROVED: "#4CAF50", // Green
    REJECTED: "#F44336", // Red
    SCHEDULED: "#2196F3", // Blue
    OUT_FOR_DELIVERY: "#9C27B0", // Purple
    DELIVERED: "#8BC34A", // Light Green
    FAILED: "#FF5722", // Deep Orange
    CANCELLED: "#9E9E9E", // Gray
  };
  return colors[status] || "#000000";
}
