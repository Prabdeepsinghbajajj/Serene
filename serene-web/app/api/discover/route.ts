import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getDiscoveryPosts } from "@/lib/feed/discovery";
import type { FeedPost } from "@/types/feed";
import type { Json } from "@/types/database";

function getMidnightISO(): string {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.toISOString();
}

export async function GET() {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  /* Get today's scored post IDs (cached after first call) */
  const postIds = await getDiscoveryPosts(user.id);

  if (postIds.length === 0) {
    return NextResponse.json({
      posts: [],
      refreshes_at: getMidnightISO(),
    });
  }

  /* Fetch full post rows for the selected IDs */
  const { data: rawPosts } = await supabase
    .from("posts")
    .select(
      `id, user_id, content_type, caption, media_urls,
       mood_tag, ai_companion_message, ai_sentiment_score,
       is_story, story_expires_at, scheduled_for, is_published,
       created_at, updated_at,
       users!inner (id, display_name, avatar_url)`
    )
    .in("id", postIds)
    .eq("is_published", true);

  if (!rawPosts || rawPosts.length === 0) {
    return NextResponse.json({ posts: [], refreshes_at: getMidnightISO() });
  }

  /* Populate has_resonated */
  const { data: resonances } = await supabase
    .from("resonances")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  const resonatedIds = new Set(resonances?.map((r) => r.post_id) ?? []);

  /* Re-order to match the scored postIds order */
  const postMap = new Map(rawPosts.map((p) => [p.id, p]));
  const ordered: FeedPost[] = postIds
    .map((id) => {
      const post = postMap.get(id);
      if (!post) return null;
      const creatorRaw = Array.isArray(post.users) ? post.users[0] : post.users;
      const creator = creatorRaw as {
        id: string;
        display_name: string;
        avatar_url: string | null;
      };
      return {
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
        creator: { id: creator.id, display_name: creator.display_name, avatar_url: creator.avatar_url },
        has_resonated: resonatedIds.has(post.id),
      } satisfies FeedPost;
    })
    .filter((p): p is FeedPost => p !== null);

  /* Log discovery impressions (deduped by day via discovery_cache) */
  if (ordered.length > 0) {
    await supabase.from("wellness_events").insert(
      ordered.map((p) => ({
        user_id: user.id,
        event_type: "discovery_impression" as const,
        metadata: { post_id: p.id } as unknown as Json,
      }))
    );
  }

  return NextResponse.json({
    posts: ordered,
    refreshes_at: getMidnightISO(),
  });
}
