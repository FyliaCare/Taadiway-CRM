import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await getServerSession(authOptions);

  return {
    session,
    prisma,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Client-specific procedure - ensures clients only access their own data
export const clientProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Get client profile for the current user
  const clientProfile = await ctx.prisma.clientProfile.findUnique({
    where: { userId: ctx.session.user.id },
  });

  if (!clientProfile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User does not have a client profile",
    });
  }

  // Check subscription status
  if (
    clientProfile.subscriptionStatus === "EXPIRED" ||
    clientProfile.subscriptionStatus === "SUSPENDED" ||
    clientProfile.subscriptionStatus === "CANCELLED"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your subscription is ${clientProfile.subscriptionStatus.toLowerCase()}. Please renew to continue.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      clientProfile,
    },
  });
});

// Admin-only procedure
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const isAdmin =
    ctx.session.user.role === "SUPER_ADMIN" ||
    ctx.session.user.role === "ADMIN";

  if (!isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx,
  });
});
