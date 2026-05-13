import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getTimeOfDay,
  scoreMoodTime,
  scoreRecency,
  scoreRelationship,
  stableSerendipity,
  computeFinalScore,
  applyDiversityFilter,
} from "@/lib/feed/scoring";
import type { FeedPost, FeedResponse } from "@/types/feed";

const POSTS_PER_PAGE = 15;
const DAILY_CAP = 30;
const CANDIDATE_LIMIT = 200;

export async function GET(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  /* 1. Check daily cap (server-enforced per bible §8) */
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: impressionsToday } = await supabase
    .from("wellness_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "post_impression")
    .gte("created_at", todayStart.toISOString());

  const dailyCount = impressionsToday ?? 0;
  if (dailyCount >= DAILY_CAP) {
    return NextResponse.json({
      posts: [],
      page,
      has_more: false,
      daily_limit_reached: true,
      impressions_today: dailyCount,
    } satisfies FeedResponse);
  }

  /* 2. Get followed user IDs */
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = follows?.map((f) => f.following_id) ?? [];
  // Always include own posts
  const seen = new Set<string>(followedIds);
  seen.add(user.id);
  const candidateUserIds = Array.from(seen);

  if (candidateUserIds.length === 0) {
    return NextResponse.json({
      posts: [],
      page: 1,
      has_more: false,
      daily_limit_reached: false,
      impressions_today: dailyCount,
    } satisfies FeedResponse);
  }

  /* 3. Fetch candidate posts (last 48h only — bible §8 hard constraint) */
  const fortyEightHoursAgo = new Date(
    Date.now() - 48 * 3_600_000
  ).toISOString();

  const { data: rawPosts } = await supabase
    .from("posts")
    .select(
      `
      id, user_id, content_type, caption, media_urls,
      mood_tag, ai_companion_message, created_at, updated_at,
      is_story, story_expires_at, scheduled_for, is_published,
      ai_sentiment_score,
      users!inner (
        id, display_name, avatar_url
      )
    `
    )
    .in("user_id", candidateUserIds)
    .eq("is_published", true)
    .eq("is_story", false)
    .gte("created_at", fortyEightHoursAgo)
    .limit(CANDIDATE_LIMIT);

  if (!rawPosts || rawPosts.length === 0) {
    return NextResponse.json({
      posts: [],
      page: 1,
      has_more: false,
      daily_limit_reached: false,
      impressions_today: dailyCount,
    } satisfies FeedResponse);
  }

  /* 4. Fetch personality profile for scoring (server-side only, per §11) */
  const { data: profile } = await supabase
    .from("personality_profiles")
    .select("interaction_graph, time_preferences")
    .eq("user_id", user.id)
    .single();

  const interactionGraph: Record<string, number> =
    (profile?.interaction_graph as Record<string, number>) ?? {};
  const timePrefs =
    (profile?.time_preferences as Record<string, string[]>) ?? {};
  const timeOfDay = getTimeOfDay();
  const preferredMoods: string[] = timePrefs[timeOfDay] ?? [];

  /* 5. Score every candidate */
  const scored = rawPosts.map((post) => {
    // Supabase returns users as object or array depending on join cardinality
    const creatorRaw = Array.isArray(post.users) ? post.users[0] : post.users;
    const creator = creatorRaw as {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };

    const relationshipScore = scoreRelationship(
      post.user_id,
      interactionGraph
    );
    const moodScore = scoreMoodTime(post.mood_tag, timeOfDay, preferredMoods);
    const recencyScore = scoreRecency(post.created_at);
    const serendipity = stableSerendipity(post.id, user.id);
    const finalScore = computeFinalScore({
      relationshipScore,
      moodScore,
      recencyScore,
      serendipity,
    });

    const feedPost: FeedPost = {
      id: post.id,
      user_id: post.user_id,
      content_type: post.content_type,
      caption: post.caption,
      media_urls: post.media_urls,
      mood_tag: post.mood_tag,
      ai_companion_message: post.ai_companion_message,
      ai_sentiment_score: post.ai_sentiment_score,
      is_story: post.is_story,
      story_expires_at: post.story_expires_at,
      scheduled_for: post.scheduled_for,
      is_published: post.is_published,
      created_at: post.created_at,
      updated_at: post.updated_at,
      creator: {
        id: creator.id,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
      },
      has_resonated: false, // populated below
      // resonance_count intentionally omitted — only sent to post owner
    };

    return { post: feedPost, finalScore };
  });

  /* 6. Populate has_resonated for all candidate posts */
  const postIds = scored.map((s) => s.post.id);
  const { data: resonances } = await supabase
    .from("resonances")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  const resonatedIds = new Set(resonances?.map((r) => r.post_id) ?? []);
  for (const s of scored) {
    s.post.has_resonated = resonatedIds.has(s.post.id);
  }

  /* 7. Sort DESC by final score, apply diversity filter */
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const sorted = applyDiversityFilter(scored.map((s) => s.post));

  /* 8. Paginate — max 15 per page (bible §8 hard constraint) */
  const start = (page - 1) * POSTS_PER_PAGE;
  const paginated = sorted.slice(start, start + POSTS_PER_PAGE);
  const hasMore =
    sorted.length > start + POSTS_PER_PAGE &&
    dailyCount + paginated.length < DAILY_CAP;

  return NextResponse.json({
    posts: paginated,
    page,
    has_more: hasMore,
    daily_limit_reached: false,
    impressions_today: dailyCount,
  } satisfies FeedResponse);
}
