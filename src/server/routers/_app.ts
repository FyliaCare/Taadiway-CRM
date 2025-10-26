import { createTRPCRouter } from "@/lib/trpc/trpc";
import { clientRouter } from "./client";
import { productRouter } from "./product";
import { saleRouter } from "./sale";
import { inventoryRouter } from "./inventory";
import { subscriptionRouter } from "./subscription";
import { notificationRouter } from "./notification";
import { userRouter } from "./user";
import { vendorRouter } from "./vendor";
import { billingRouter } from "./billing";
import { deliveryRequestRouter } from "./deliveryRequest";
import { invoiceRouter } from "./invoice";
import { autoApprovalRouter } from "./autoApproval";
import { calendarRouter } from "./calendar";
import { reportsRouter } from "./reports";

export const appRouter = createTRPCRouter({
  client: clientRouter,
  product: productRouter,
  sale: saleRouter,
  inventory: inventoryRouter,
  subscription: subscriptionRouter,
  notification: notificationRouter,
  user: userRouter,
  vendor: vendorRouter,
  billing: billingRouter,
  deliveryRequest: deliveryRequestRouter,
  invoice: invoiceRouter,
  autoApproval: autoApprovalRouter,
  calendar: calendarRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
