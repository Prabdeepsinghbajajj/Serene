/**
 * Ad category constants — immutable, enforced server-side (bible §10).
 * These are never configurable by users or admins.
 * Import this module in any route that handles ad selection or insertion.
 */

/* -------------------------------------------------------------------------- */
/*  Allowed categories (whitelist)                                             */
/* -------------------------------------------------------------------------- */
export const ALLOWED_AD_CATEGORIES = [
  "mental_health_apps",
  "physical_wellness",
  "healthy_food_cooking",
  "nature_outdoor_activities",
  "creativity_tools",
  "education",
  "sustainable_products",
  "sleep_aids",
  "local_community_events",
] as const;

/* -------------------------------------------------------------------------- */
/*  Blocked categories (blacklist — enforce at insertion, not just display)   */
/* -------------------------------------------------------------------------- */
export const BLOCKED_AD_CATEGORIES = [
  "fast_fashion",
  "gambling",
  "alcohol",
  "tobacco",
  "weight_loss",
  "beauty_filters_or_surgery",
  "social_comparison_products",
  "fomo_promotions",
  "cryptocurrency",
  "financial_trading",
] as const;

export type AllowedAdCategory = (typeof ALLOWED_AD_CATEGORIES)[number];
export type BlockedAdCategory = (typeof BLOCKED_AD_CATEGORIES)[number];

/** Returns true only if the category is on the whitelist (§10). */
export function isAllowedCategory(category: string): boolean {
  return (ALLOWED_AD_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Returns true only if every category in the array is on the whitelist.
 * Use this to gate ad insertion AND ad display.
 */
export function validateAdCategories(categories: string[]): boolean {
  return categories.every(isAllowedCategory);
}
