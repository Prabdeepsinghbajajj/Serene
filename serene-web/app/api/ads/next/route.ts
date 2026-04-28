import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validateAdCategories } from "@/lib/ads/categories";
import type { ServedAd } from "@/types/ads";

export async function GET() {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ad: null });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ad: null });

  /* Get user's personality type and blocked categories (server-side only — §11) */
  const [profileRes, userRes] = await Promise.all([
    supabase
      .from("personality_profiles")
      .select("blocked_ad_categories")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("users")
      .select("personality_type")
      .eq("id", user.id)
      .single(),
  ]);

  const blockedCategories: string[] =
    (profileRes.data?.blocked_ad_categories as string[]) ?? [];
  const personalityType = userRes.data?.personality_type ?? null;

  /* Avoid repeating ads shown in the last 7 days */
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
  const { data: recentImpressions } = await supabase
    .from("ad_impressions")
    .select("ad_id")
    .eq("user_id", user.id)
    .gte("shown_at", sevenDaysAgo);

  const recentAdIds = (recentImpressions ?? [])
    .map((i) => i.ad_id)
    .filter(Boolean) as string[];

  /* Fetch active ads (excluding recently shown) */
  let query = supabase.from("ads").select("*").eq("is_active", true);
  if (recentAdIds.length > 0) {
    query = query.not("id", "in", `(${recentAdIds.join(",")})`);
  }
  const { data: candidates } = await query;

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ad: null });
  }

  /* ---- Filter: whitelist check + user preferences + personality match ---- */
  const eligible = candidates.filter((ad) => {
    const categories: string[] = (ad.allowed_categories as string[]) ?? [];

    // Hard whitelist enforcement (bible §10) — reject any ad with uncategorized content
    if (categories.length === 0 || !validateAdCategories(categories)) return false;

    // User-dismissed categories
    if (blockedCategories.some((blocked) => categories.includes(blocked)))
      return false;

    // Personality targeting (empty = show to everyone)
    const personalityTags: string[] = (ad.personality_tags as string[]) ?? [];
    if (
      personalityTags.length > 0 &&
      personalityType &&
      !personalityTags.includes(personalityType)
    )
      return false;

    return true;
  });

  if (eligible.length === 0) return NextResponse.json({ ad: null });

  /* Pick one at random from eligible pool */
  const ad = eligible[Math.floor(Math.random() * eligible.length)];

  /* Log impression — targeting reason is NEVER sent to client (§11) */
  const { data: impression } = await supabase
    .from("ad_impressions")
    .insert({
      user_id: user.id,
      ad_id: ad.id,
      shown_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const servedAd: ServedAd = {
    ...(ad as Parameters<typeof Object.assign>[1]),
    impression_id: impression?.id ?? "",
  };

  return NextResponse.json({ ad: servedAd });
}
