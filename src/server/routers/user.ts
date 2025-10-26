import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const userRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        adminProfile: true,
        clientProfile: {
          include: {
            subscription: true,
          },
        },
      },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  // Change own password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update password
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });
    }),

  // List all users (admin only)
  list: protectedProcedure
    .input(
      z.object({
        role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "USER"]).optional(),
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user has permission
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { adminProfile: true },
      });

      if (!currentUser?.adminProfile?.canManageUsers && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view users",
        });
      }

      return ctx.prisma.user.findMany({
        where: {
          role: input.role,
          isActive: input.includeInactive ? undefined : true,
        },
        include: {
          adminProfile: true,
          clientProfile: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create new user (admin only)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["ADMIN", "MANAGER", "STAFF", "USER"]),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        position: z.string().optional(),
        department: z.string().optional(),
        // Permissions
        permissions: z.object({
          canManageClients: z.boolean().default(false),
          canRecordSales: z.boolean().default(false),
          canManageInventory: z.boolean().default(false),
          canManageUsers: z.boolean().default(false),
          canViewReports: z.boolean().default(false),
          canManageSettings: z.boolean().default(false),
          canDeleteData: z.boolean().default(false),
          canManagePayments: z.boolean().default(false),
          canExportData: z.boolean().default(false),
          canManageProducts: z.boolean().default(false),
          canApproveRefunds: z.boolean().default(false),
          maxDiscountPercent: z.number().min(0).max(100).default(0),
          restrictedToClients: z.array(z.string()).default([]),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { adminProfile: true },
      });

      if (!currentUser?.adminProfile?.canManageUsers && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create users",
        });
      }

      // Super admin cannot be created by anyone
      // @ts-expect-error - Intentionally checking for SUPER_ADMIN to prevent it
      if (input.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Super admin accounts cannot be created through this interface",
        });
      }

      // Check if email already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user with admin profile
      const newUser = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          phone: input.phone,
          whatsappNumber: input.whatsappNumber,
          createdById: ctx.session.user.id,
          adminProfile: {
            create: {
              position: input.position,
              department: input.department,
              ...input.permissions,
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      return newUser;
    }),

  // Update user (admin only)
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsappNumber: z.string().optional(),
        role: z.enum(["ADMIN", "MANAGER", "STAFF", "USER"]).optional(),
        isActive: z.boolean().optional(),
        position: z.string().optional(),
        department: z.string().optional(),
        permissions: z.object({
          canManageClients: z.boolean().optional(),
          canRecordSales: z.boolean().optional(),
          canManageInventory: z.boolean().optional(),
          canManageUsers: z.boolean().optional(),
          canViewReports: z.boolean().optional(),
          canManageSettings: z.boolean().optional(),
          canDeleteData: z.boolean().optional(),
          canManagePayments: z.boolean().optional(),
          canExportData: z.boolean().optional(),
          canManageProducts: z.boolean().optional(),
          canApproveRefunds: z.boolean().optional(),
          maxDiscountPercent: z.number().min(0).max(100).optional(),
          restrictedToClients: z.array(z.string()).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { adminProfile: true },
      });

      if (!currentUser?.adminProfile?.canManageUsers && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update users",
        });
      }

      // Check if trying to modify a super admin
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Super admin accounts cannot be modified",
        });
      }

      // Prevent changing role to SUPER_ADMIN
      // @ts-expect-error - Intentionally checking for SUPER_ADMIN to prevent it
      if (input.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot assign super admin role",
        });
      }

      const { permissions, ...userData } = input;

      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          ...userData,
          adminProfile: permissions ? {
            update: permissions,
          } : undefined,
        },
        include: {
          adminProfile: true,
        },
      });
    }),

  // Delete user (super admin only)
  delete: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is super admin
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can delete users",
        });
      }

      // Check if trying to delete a super admin
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Super admin accounts cannot be deleted",
        });
      }

      // Prevent self-deletion
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        });
      }

      return ctx.prisma.user.delete({
        where: { id: input.userId },
      });
    }),

  // Deactivate user (admin only)
  deactivate: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { adminProfile: true },
      });

      if (!currentUser?.adminProfile?.canManageUsers && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to deactivate users",
        });
      }

      // Check if trying to deactivate a super admin
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Super admin accounts cannot be deactivated",
        });
      }

      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { isActive: false },
      });
    }),

  // Reset password (admin only)
  resetPassword: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { adminProfile: true },
      });

      if (!currentUser?.adminProfile?.canManageUsers && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to reset passwords",
        });
      }

      // Check if trying to reset super admin password
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.isSuperAdmin && !currentUser?.isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can reset super admin passwords",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });
    }),

  // Get user permissions (for checking access)
  getPermissions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { adminProfile: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.adminProfile || null,
    };
  }),
});
