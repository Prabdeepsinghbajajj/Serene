import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" });

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = follows?.map((f) => f.following_id) ?? [];
  const excludeIds = [...followedIds, user.id];

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 3_600_000
  ).toISOString();

  /* Step 1: all posts without any filter */
  const { data: allPosts } = await supabase
    .from("posts")
    .select("id, user_id, is_published, is_story, created_at")
    .limit(20);

  /* Step 2: only published non-story posts */
  const { data: publishedPosts } = await supabase
    .from("posts")
    .select("id, user_id, is_published, is_story")
    .eq("is_published", true)
    .eq("is_story", false)
    .limit(20);

  /* Step 3: published + within 30 days */
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, user_id, is_published, is_story, created_at")
    .eq("is_published", true)
    .eq("is_story", false)
    .gte("created_at", thirtyDaysAgo)
    .limit(20);

  /* Step 4: exclude own user ID (and followed users) */
  const { data: filteredPosts, error: filterError } = await supabase
    .from("posts")
    .select("id, user_id, is_published, is_story")
    .eq("is_published", true)
    .eq("is_story", false)
    .gte("created_at", thirtyDaysAgo)
    .not("user_id", "in", `(${excludeIds.join(",")})`)
    .limit(20);

  /* Check discovery cache for today */
  const today = new Date().toISOString().split("T")[0];
  const { data: cache } = await supabase
    .from("discovery_cache")
    .select("*")
    .eq("user_id", user.id)
    .eq("generated_date", today);

  return NextResponse.json({
    your_user_id: user.id,
    excluded_ids: excludeIds,
    step1_all_posts: allPosts?.length,
    step2_published_nonstory: publishedPosts?.length,
    step3_recent: recentPosts?.length,
    step4_after_exclude: filteredPosts?.length,
    step4_error: filterError?.message ?? null,
    step4_posts: filteredPosts,
    cache_today: cache,
  });
}
