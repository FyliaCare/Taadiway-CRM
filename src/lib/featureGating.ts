import { SubscriptionPlan } from "@prisma/client";

// Feature flags for each subscription tier
export type Feature =
  | "PRODUCTS_BASIC" // Up to 50 products
  | "PRODUCTS_STANDARD" // Up to 200 products
  | "PRODUCTS_UNLIMITED" // Unlimited products
  | "AUTO_APPROVAL" // Auto-approval rules
  | "AUTO_APPROVAL_LIMITED" // Up to 3 rules
  | "AUTO_APPROVAL_UNLIMITED" // Unlimited rules
  | "CALENDAR_SCHEDULING" // Calendar and scheduling features
  | "ADVANCED_ANALYTICS" // Advanced reports beyond 30 days
  | "ANALYTICS_90_DAYS" // 90-day history
  | "ANALYTICS_UNLIMITED" // Unlimited history
  | "CUSTOM_INVOICE_TEMPLATES" // Custom invoice branding
  | "EXCEL_EXPORT" // Excel export functionality
  | "PDF_EXPORT" // PDF export functionality
  | "PRIORITY_SUPPORT" // Priority customer support
  | "API_ACCESS" // API access for integrations
  | "AI_PREDICTIONS"; // AI-powered inventory predictions

// Feature matrix: which features are available per tier
const FEATURE_MATRIX: Record<SubscriptionPlan, Feature[]> = {
  BASIC: [
    "PRODUCTS_BASIC", // Up to 50 products
    "PDF_EXPORT", // PDF export only
  ],
  STANDARD: [
    "PRODUCTS_STANDARD", // Up to 200 products
    "AUTO_APPROVAL_LIMITED", // Up to 3 auto-approval rules
    "CALENDAR_SCHEDULING", // Calendar features
    "ANALYTICS_90_DAYS", // 90-day analytics history
    "CUSTOM_INVOICE_TEMPLATES", // Custom templates (limit 3)
    "EXCEL_EXPORT", // Excel export
    "PDF_EXPORT", // PDF export
  ],
  PREMIUM: [
    "PRODUCTS_UNLIMITED", // Unlimited products
    "AUTO_APPROVAL_UNLIMITED", // Unlimited auto-approval rules
    "CALENDAR_SCHEDULING", // Calendar features
    "ANALYTICS_UNLIMITED", // Unlimited analytics history
    "CUSTOM_INVOICE_TEMPLATES", // Unlimited custom templates
    "EXCEL_EXPORT", // Excel export
    "PDF_EXPORT", // PDF export
    "PRIORITY_SUPPORT", // Priority support
    "API_ACCESS", // API access
    "AI_PREDICTIONS", // AI predictions
  ],
};

// Numeric limits for certain features
export const TIER_LIMITS = {
  BASIC: {
    maxProducts: 50,
    maxAutoApprovalRules: 0,
    maxCustomTemplates: 1, // Standard template only
    analyticsHistoryDays: 30,
  },
  STANDARD: {
    maxProducts: 200,
    maxAutoApprovalRules: 3,
    maxCustomTemplates: 3,
    analyticsHistoryDays: 90,
  },
  PREMIUM: {
    maxProducts: 999999, // Effectively unlimited
    maxAutoApprovalRules: 999999, // Effectively unlimited
    maxCustomTemplates: 999999, // Effectively unlimited
    analyticsHistoryDays: 999999, // Effectively unlimited
  },
};

/**
 * Check if a feature is available for a given subscription plan
 */
export function checkFeatureAccess(feature: Feature, plan: SubscriptionPlan): boolean {
  return FEATURE_MATRIX[plan].includes(feature);
}

/**
 * Get all features available for a given plan
 */
export function getPlanFeatures(plan: SubscriptionPlan): Feature[] {
  return FEATURE_MATRIX[plan];
}

/**
 * Get feature limits for a given plan
 */
export function getPlanLimits(plan: SubscriptionPlan) {
  return TIER_LIMITS[plan];
}

/**
 * Check if a plan can create more products
 */
export function canCreateProduct(currentCount: number, plan: SubscriptionPlan): boolean {
  return currentCount < TIER_LIMITS[plan].maxProducts;
}

/**
 * Check if a plan can create more auto-approval rules
 */
export function canCreateAutoApprovalRule(currentCount: number, plan: SubscriptionPlan): boolean {
  return currentCount < TIER_LIMITS[plan].maxAutoApprovalRules;
}

/**
 * Check if a plan can create more custom invoice templates
 */
export function canCreateCustomTemplate(currentCount: number, plan: SubscriptionPlan): boolean {
  return currentCount < TIER_LIMITS[plan].maxCustomTemplates;
}

/**
 * Get analytics history limit in days for a plan
 */
export function getAnalyticsHistoryDays(plan: SubscriptionPlan): number {
  return TIER_LIMITS[plan].analyticsHistoryDays;
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(feature: Feature, currentPlan: SubscriptionPlan): string {
  const messages: Record<Feature, string> = {
    PRODUCTS_BASIC: `Your BASIC plan allows up to 50 products. Upgrade to STANDARD for 200 products.`,
    PRODUCTS_STANDARD: `Your STANDARD plan allows up to 200 products. Upgrade to PREMIUM for unlimited products.`,
    PRODUCTS_UNLIMITED: `Upgrade to PREMIUM for unlimited products.`,
    AUTO_APPROVAL: `Auto-approval rules are available on STANDARD and PREMIUM plans. Upgrade to automate your workflow.`,
    AUTO_APPROVAL_LIMITED: `Your STANDARD plan allows up to 3 auto-approval rules. Upgrade to PREMIUM for unlimited rules.`,
    AUTO_APPROVAL_UNLIMITED: `Upgrade to PREMIUM for unlimited auto-approval rules.`,
    CALENDAR_SCHEDULING: `Calendar scheduling is available on STANDARD and PREMIUM plans. Upgrade to schedule deliveries efficiently.`,
    ADVANCED_ANALYTICS: `Advanced analytics are available on STANDARD and PREMIUM plans. Upgrade for deeper insights.`,
    ANALYTICS_90_DAYS: `Your STANDARD plan shows 90 days of history. Upgrade to PREMIUM for unlimited history.`,
    ANALYTICS_UNLIMITED: `Upgrade to PREMIUM for unlimited analytics history.`,
    CUSTOM_INVOICE_TEMPLATES: `Custom invoice templates are available on STANDARD (3 templates) and PREMIUM (unlimited). Upgrade to brand your invoices.`,
    EXCEL_EXPORT: `Excel export is available on STANDARD and PREMIUM plans. Upgrade to export your data.`,
    PDF_EXPORT: `PDF export is available on all plans.`,
    PRIORITY_SUPPORT: `Priority support is available on PREMIUM plan. Upgrade for faster response times.`,
    API_ACCESS: `API access is available on PREMIUM plan. Upgrade to integrate with other systems.`,
    AI_PREDICTIONS: `AI-powered predictions are available on PREMIUM plan. Upgrade for intelligent inventory forecasting.`,
  };

  return messages[feature] || "This feature requires a higher subscription tier.";
}

/**
 * Get recommended plan for a feature
 */
export function getRecommendedPlan(feature: Feature): SubscriptionPlan {
  if (FEATURE_MATRIX.STANDARD.includes(feature)) {
    return "STANDARD";
  }
  if (FEATURE_MATRIX.PREMIUM.includes(feature)) {
    return "PREMIUM";
  }
  return "BASIC";
}

/**
 * Compare two plans - returns true if plan1 is higher than plan2
 */
export function isPlanHigherThan(plan1: SubscriptionPlan, plan2: SubscriptionPlan): boolean {
  const planHierarchy: Record<SubscriptionPlan, number> = {
    BASIC: 1,
    STANDARD: 2,
    PREMIUM: 3,
  };
  return planHierarchy[plan1] > planHierarchy[plan2];
}

/**
 * Get next plan upgrade option
 */
export function getNextPlanUpgrade(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  const upgradePath: Record<SubscriptionPlan, SubscriptionPlan | null> = {
    BASIC: "STANDARD",
    STANDARD: "PREMIUM",
    PREMIUM: null, // Already at highest tier
  };
  return upgradePath[currentPlan];
}
