import type { Ad } from "@/types/database";

/**
 * Allowed ad categories — whitelist from bible §10.
 * Nothing outside this union may be served to users.
 */
export type AdCategory =
  | "mental_health_apps"
  | "physical_wellness"
  | "healthy_food_cooking"
  | "nature_outdoor_activities"
  | "creativity_tools"
  | "education"
  | "sustainable_products"
  | "sleep_aids"
  | "local_community_events";

/**
 * Blocked ad categories — blacklist from bible §10.
 * Enforced at insertion time, not just display time.
 */
export type BlockedAdCategory =
  | "fast_fashion"
  | "gambling"
  | "alcohol"
  | "tobacco"
  | "weight_loss"
  | "beauty_filters_or_surgery"
  | "social_comparison_products"
  | "fomo_promotions"
  | "cryptocurrency"
  | "financial_trading";

/**
 * An ad that has been selected for display, with its impression ID already
 * created server-side. The client only receives this shape — never the raw
 * targeting reason or personality data that was used to select it (bible §11).
 */
export interface ServedAd extends Ad {
  /** The ad_impressions.id created when this ad was selected — used for dismiss/click tracking */
  impression_id: string;
}
