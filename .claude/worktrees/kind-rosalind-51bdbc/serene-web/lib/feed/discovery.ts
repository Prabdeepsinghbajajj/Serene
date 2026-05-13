import { createClient } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/*  Discovery algorithm                                                        */
/*  bible §7: Discovery tab — 10 posts, refreshes once at midnight only       */
/* -------------------------------------------------------------------------- */

export async function getDiscoveryPosts(userId: string): Promise<string[]> {
  const supabase = createClient();
  if (!supabase) return [];

  /* Check if today's discovery is already cached */
  const today = new Date().toISOString().split("T")[0];
  const { data: cached } = await supabase
    .from("discovery_cache")
    .select("post_ids")
    .eq("user_id", userId)
    .eq("generated_date", today)
    .single();

  if (cached?.post_ids?.length) return cached.post_ids as string[];

  /* Fetch personality profile for interest/mood matching */
  const { data: profile } = await supabase
    .from("personality_profiles")
    .select("interests, inferred_values, time_preferences")
    .eq("user_id", userId)
    .single();

  /* Exclude already-followed users and self */
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followedIds = follows?.map((f) => f.following_id) ?? [];
  const excludeIds = [...followedIds, userId];

  /* Posts already logged as discovery impressions — don't show again */
  const { data: seenEvents } = await supabase
    .from("wellness_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("event_type", "discovery_impression");

  const seenPostIds: string[] = (seenEvents ?? [])
    .map((e) => (e.metadata as Record<string, string>)?.post_id)
    .filter(Boolean);

  /* Candidates: published non-story posts from non-followed users, last 30d */
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 3_600_000
  ).toISOString();

  let query = supabase
    .from("posts")
    .select("id, user_id, mood_tag, created_at")
    .eq("is_published", true)
    .eq("is_story", false)
    .gte("created_at", thirtyDaysAgo)
    .limit(100);

  if (excludeIds.length > 0) {
    query = query.not("user_id", "in", `(${excludeIds.join(",")})`);
  }
  if (seenPostIds.length > 0) {
    query = query.not("id", "in", `(${seenPostIds.join(",")})`);
  }

  const { data: candidates } = await query;

  if (!candidates || candidates.length === 0) return [];

  /* Score: mood-time match + serendipity (no engagement metrics per §8) */
  const timeOfDay = getDiscoveryTimeOfDay();
  const preferredMoods =
    (profile?.time_preferences as Record<string, string[]>)?.[timeOfDay] ?? [];

  const scored = candidates.map((post) => ({
    id: post.id,
    score:
      (post.mood_tag && preferredMoods.includes(post.mood_tag) ? 0.6 : 0) +
      Math.random() * 0.4, // serendipity component
  }));

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, 10).map((s) => s.id);

  /* Cache for the day */
  await supabase
    .from("discovery_cache")
    .upsert(
      { user_id: userId, post_ids: selected, generated_date: today },
      { onConflict: "user_id,generated_date" }
    );

  return selected;
}

function getDiscoveryTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "late_night";
}
