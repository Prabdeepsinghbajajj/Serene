import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { pathsFromPostMediaUrls } from "@/lib/storage/post-media-paths";
import type { FeedPost } from "@/types/feed";
import type { Database } from "@/types/database";

type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

const moodTagEnum = z.enum([
  "joyful",
  "grateful",
  "peaceful",
  "reflective",
  "creative",
  "adventurous",
]);

const patchSchema = z
  .object({
    caption: z.string().max(300).optional(),
    mood_tag: moodTagEnum.optional(),
  })
  .refine((b) => b.caption !== undefined || b.mood_tag !== undefined, {
    message: "Provide caption and/or mood_tag to update.",
  });

const postSelect = `
  id,
  user_id,
  content_type,
  caption,
  media_urls,
  mood_tag,
  ai_companion_message,
  ai_sentiment_score,
  is_story,
  story_expires_at,
  scheduled_for,
  is_published,
  created_at,
  updated_at,
  users!inner (
    id,
    display_name,
    avatar_url
  )
`;

function mapUserJoin(users: unknown): {
  id: string;
  display_name: string;
  avatar_url: string | null;
} | null {
  const u = Array.isArray(users) ? users[0] : users;
  if (!u || typeof u !== "object") return null;
  const o = u as Record<string, string | null>;
  if (!o.id || !o.display_name) return null;
  return {
    id: o.id,
    display_name: o.display_name,
    avatar_url: o.avatar_url ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  GET — single post as FeedPost (profile sheet / permalink)                 */
/*  Uses service role when configured so viewers can open non-follow posts. */
/* -------------------------------------------------------------------------- */
export async function GET(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const postId = params.postId;
  if (!z.string().uuid().safeParse(postId).success) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const db =
    process.env.SERENE_SUPABASE_SERVICE_KEY &&
    process.env.NEXT_PUBLIC_SERENE_SUPABASE_URL
      ? createAdminClient()
      : supabase;

  const { data: row, error } = await db
    .from("posts")
    .select(postSelect)
    .eq("id", postId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const post = row as {
    id: string;
    user_id: string;
    content_type: FeedPost["content_type"];
    caption: string | null;
    media_urls: string[] | null;
    mood_tag: FeedPost["mood_tag"];
    ai_companion_message: string | null;
    ai_sentiment_score: number | null;
    is_story: boolean;
    story_expires_at: string | null;
    scheduled_for: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    users: unknown;
  };

  const visible =
    (post.is_published && !post.is_story) || post.user_id === viewer.id;
  if (!visible) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const creator = mapUserJoin(post.users);
  if (!creator) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { data: resRow } = await supabase
    .from("resonances")
    .select("post_id")
    .eq("user_id", viewer.id)
    .eq("post_id", postId)
    .maybeSingle();

  let resonance_count: number | undefined;
  if (viewer.id === post.user_id) {
    const { count } = await supabase
      .from("resonances")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    resonance_count = count ?? 0;
  }

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
    has_resonated: Boolean(resRow),
    ...(resonance_count !== undefined ? { resonance_count } : {}),
  };

  return NextResponse.json({ post: feedPost });
}

/* -------------------------------------------------------------------------- */
/*  PATCH — caption + mood_tag (owner only)                                   */
/* -------------------------------------------------------------------------- */
export async function PATCH(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const postId = params.postId;
  if (!z.string().uuid().safeParse(postId).success) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const { data: ownerRow, error: ownErr } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();

  if (ownErr || !ownerRow) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (ownerRow.user_id !== viewer.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed." },
      { status: 400 }
    );
  }

  const updates: PostUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.caption !== undefined) {
    updates.caption = parsed.data.caption.length === 0 ? null : parsed.data.caption;
  }
  if (parsed.data.mood_tag !== undefined) {
    updates.mood_tag = parsed.data.mood_tag;
  }

  const { data: updated, error: upErr } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("user_id", viewer.id)
    .select("id, caption, mood_tag, updated_at")
    .single();

  if (upErr || !updated) {
    return NextResponse.json({ error: "Could not update post." }, { status: 400 });
  }

  return NextResponse.json({ post: updated });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — owner only, remove storage objects first                         */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const postId = params.postId;
  if (!z.string().uuid().safeParse(postId).success) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const { data: post, error: fetchErr } = await supabase
    .from("posts")
    .select("user_id, media_urls")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (post.user_id !== viewer.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const paths = pathsFromPostMediaUrls(post.media_urls);
  if (paths.length > 0) {
    const { error: rmErr } = await supabase.storage.from("posts").remove(paths);
    if (rmErr) {
      return NextResponse.json(
        { error: "Could not remove media. Try again." },
        { status: 500 }
      );
    }
  }

  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", viewer.id);

  if (delErr) {
    return NextResponse.json({ error: "Could not delete post." }, { status: 500 });
  }

  return NextResponse.json({ success: true as const });
}
