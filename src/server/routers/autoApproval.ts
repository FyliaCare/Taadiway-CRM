import { z } from "zod";
import { createTRPCRouter, clientProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { RuleType } from "@prisma/client";

// Subscription tier limits for auto-approval rules
const TIER_LIMITS = {
  BASIC: 0, // No auto-approval for BASIC
  STANDARD: 3, // Up to 3 rules
  PREMIUM: 999999, // Unlimited
};

export const autoApprovalRouter = createTRPCRouter({
  // ============================================
  // VENDOR: CREATE AUTO-APPROVAL RULE
  // ============================================
  create: clientProcedure
    .input(
      z.object({
        name: z.string().min(1, "Rule name is required"),
        description: z.string().optional(),
        ruleType: z.enum(["CUSTOMER", "PRODUCT", "AMOUNT", "TIME", "COMBINED"]),
        priority: z.number().min(1).default(1),
        isActive: z.boolean().default(true),
        // Customer whitelist
        customerPhones: z.array(z.string()).optional(),
        // Product whitelist
        productIds: z.array(z.string()).optional(),
        // Amount threshold
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        // Time window
        allowedDays: z.array(z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])).optional(),
        startTime: z.string().optional(), // HH:MM format
        endTime: z.string().optional(), // HH:MM format
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = ctx.clientProfile;

      // Check subscription tier
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active subscription found",
        });
      }

      // Check tier limit
      const currentRuleCount = await ctx.prisma.autoApprovalRule.count({
        where: {
          clientProfileId: clientProfile.id,
          isActive: true,
        },
      });

      const limit = TIER_LIMITS[subscription.plan] || 0;
      if (currentRuleCount >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${subscription.plan} plan allows up to ${limit} auto-approval rules. Upgrade to create more.`,
        });
      }

      // Validate rule conditions
      if (input.ruleType === "CUSTOMER" && (!input.customerPhones || input.customerPhones.length === 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Customer whitelist rules require at least one customer phone number",
        });
      }

      if (input.ruleType === "PRODUCT" && (!input.productIds || input.productIds.length === 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product whitelist rules require at least one product ID",
        });
      }

      if (input.ruleType === "AMOUNT" && !input.minAmount && !input.maxAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Amount threshold rules require at least minAmount or maxAmount",
        });
      }

      if (input.ruleType === "TIME" && (!input.allowedDays || !input.startTime || !input.endTime)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Time window rules require allowedDays, startTime, and endTime",
        });
      }

      // Create rule
      const rule = await ctx.prisma.autoApprovalRule.create({
        data: {
          clientProfileId: clientProfile.id,
          name: input.name,
          description: input.description,
          ruleType: input.ruleType,
          priority: input.priority,
          isActive: input.isActive,
          customerPhones: input.customerPhones,
          productIds: input.productIds,
          minAmount: input.minAmount,
          maxAmount: input.maxAmount,
          allowedDays: input.allowedDays,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });

      return rule;
    }),

  // ============================================
  // VENDOR: LIST AUTO-APPROVAL RULES
  // ============================================
  list: clientProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, isActive } = input;
      const skip = (page - 1) * limit;

      const where: any = {
        clientProfileId: ctx.clientProfile.id,
      };
      if (isActive !== undefined) where.isActive = isActive;

      const [rules, total] = await Promise.all([
        ctx.prisma.autoApprovalRule.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        }),
        ctx.prisma.autoApprovalRule.count({ where }),
      ]);

      // Get subscription info for tier display
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          clientProfileId: ctx.clientProfile.id,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      const limit_info = subscription ? TIER_LIMITS[subscription.plan] : 0;

      return {
        rules,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        tierInfo: {
          plan: subscription?.plan || "BASIC",
          rulesUsed: total,
          rulesLimit: limit_info,
        },
      };
    }),

  // ============================================
  // VENDOR: GET RULE BY ID
  // ============================================
  getById: clientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rule = await ctx.prisma.autoApprovalRule.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auto-approval rule not found",
        });
      }

      return rule;
    }),

  // ============================================
  // VENDOR: UPDATE AUTO-APPROVAL RULE
  // ============================================
  update: clientProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        priority: z.number().min(1).optional(),
        customerPhones: z.array(z.string()).optional(),
        productIds: z.array(z.string()).optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        allowedDays: z.array(z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const rule = await ctx.prisma.autoApprovalRule.findFirst({
        where: {
          id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auto-approval rule not found",
        });
      }

      const updated = await ctx.prisma.autoApprovalRule.update({
        where: { id },
        data: updateData,
      });

      return updated;
    }),

  // ============================================
  // VENDOR: TOGGLE RULE STATUS
  // ============================================
  toggleStatus: clientProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.autoApprovalRule.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auto-approval rule not found",
        });
      }

      const updated = await ctx.prisma.autoApprovalRule.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      return updated;
    }),

  // ============================================
  // VENDOR: DELETE AUTO-APPROVAL RULE
  // ============================================
  delete: clientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.autoApprovalRule.findFirst({
        where: {
          id: input.id,
          clientProfileId: ctx.clientProfile.id,
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auto-approval rule not found",
        });
      }

      await ctx.prisma.autoApprovalRule.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================
  // INTERNAL: EVALUATE DELIVERY REQUEST AGAINST RULES
  // ============================================
  evaluateRequest: clientProcedure
    .input(
      z.object({
        customerPhone: z.string(),
        productIds: z.array(z.string()),
        totalAmount: z.number(),
        requestTime: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { customerPhone, productIds, totalAmount, requestTime = new Date() } = input;

      // Get all active rules sorted by priority
      const rules = await ctx.prisma.autoApprovalRule.findMany({
        where: {
          clientProfileId: ctx.clientProfile.id,
          isActive: true,
        },
        orderBy: { priority: "asc" },
      });

      if (rules.length === 0) {
        return {
          shouldAutoApprove: false,
          matchedRule: null,
          reason: "No active auto-approval rules",
        };
      }

      // Get current day and time
      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const currentDay = dayNames[requestTime.getDay()];
      const currentTime = `${requestTime.getHours().toString().padStart(2, "0")}:${requestTime.getMinutes().toString().padStart(2, "0")}`;

      // Evaluate each rule
      for (const rule of rules) {
        let matches = false;

        switch (rule.ruleType) {
          case "CUSTOMER":
            matches = rule.customerPhones?.includes(customerPhone) || false;
            break;

          case "PRODUCT":
            // Check if any requested product is in the whitelist
            matches = productIds.some((id) => rule.productIds?.includes(id));
            break;

          case "AMOUNT":
            const meetsMin = !rule.minAmount || totalAmount >= rule.minAmount;
            const meetsMax = !rule.maxAmount || totalAmount <= rule.maxAmount;
            matches = meetsMin && meetsMax;
            break;

          case "TIME":
            const dayAllowed = rule.allowedDays?.includes(currentDay) || false;
            const timeInRange =
              rule.startTime && rule.endTime
                ? currentTime >= rule.startTime && currentTime <= rule.endTime
                : false;
            matches = dayAllowed && timeInRange;
            break;

          case "COMBINED":
            // Evaluate all conditions
            const conditions: boolean[] = [];

            // Customer check
            if (rule.customerPhones && rule.customerPhones.length > 0) {
              conditions.push(rule.customerPhones.includes(customerPhone));
            }

            // Product check
            if (rule.productIds && rule.productIds.length > 0) {
              conditions.push(productIds.some((id) => rule.productIds?.includes(id)));
            }

            // Amount check
            if (rule.minAmount || rule.maxAmount) {
              const meetsMin = !rule.minAmount || totalAmount >= rule.minAmount;
              const meetsMax = !rule.maxAmount || totalAmount <= rule.maxAmount;
              conditions.push(meetsMin && meetsMax);
            }

            // Time check
            if (rule.allowedDays && rule.startTime && rule.endTime) {
              const dayAllowed = rule.allowedDays.includes(currentDay);
              const timeInRange = currentTime >= rule.startTime && currentTime <= rule.endTime;
              conditions.push(dayAllowed && timeInRange);
            }

            // For COMBINED type, all conditions must be met (AND logic)
            matches = conditions.length > 0 && conditions.every((c) => c);
            break;
        }

        if (matches) {
          return {
            shouldAutoApprove: true,
            matchedRule: rule,
            reason: `Matched rule: ${rule.name}`,
          };
        }
      }

      return {
        shouldAutoApprove: false,
        matchedRule: null,
        reason: "No rules matched",
      };
    }),
});
