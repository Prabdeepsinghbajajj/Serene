import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appendMoodHistory } from "@/lib/wellness/mood-history";

/* -------------------------------------------------------------------------- */
/*  Request schema                                                              */
/* -------------------------------------------------------------------------- */
const createPostSchema = z.object({
  content_type: z.enum(["photo", "video", "text", "slow_post"]),
  caption: z.string().max(300).optional(),
  media_urls: z.array(z.string().url()).max(10).optional(),
  mood_tag: z.enum([
    "joyful",
    "grateful",
    "peaceful",
    "reflective",
    "creative",
    "adventurous",
  ]),
  text_content: z.string().max(500).optional(),
});

/* -------------------------------------------------------------------------- */
/*  POST /api/creator/post                                                     */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  /* 1. Authenticate */
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service not configured." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  /* 2. Validate body */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content_type, caption, media_urls, mood_tag, text_content } =
    parsed.data;

  /* 3. AI companion message — call post-companion route synchronously so the
        message is persisted with the post row (not fire-and-forget) */
  let ai_companion_message = "What a lovely moment to share.";
  try {
    const companionRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/post-companion`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: content_type === "text" || content_type === "slow_post"
            ? text_content ?? caption
            : caption,
          media_url: media_urls?.[0] ?? null,
          content_type,
          mood_tag,
        }),
      }
    );
    if (companionRes.ok) {
      const { message } = (await companionRes.json()) as { message: string };
      if (message) ai_companion_message = message;
    }
  } catch (e) {
    // Non-fatal — post still saves with fallback message
    console.error("post-companion fetch failed:", e);
  }

  /* 4. Build the caption field — for text/slow_post, content lives in caption */
  const finalCaption =
    content_type === "text" || content_type === "slow_post"
      ? text_content ?? caption
      : caption;

  /* 5. Insert post row */
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content_type,
      caption: finalCaption ?? null,
      media_urls: media_urls ?? [],
      mood_tag,
      is_published: true,
      ai_companion_message,
    })
    .select("id")
    .single();

  if (insertError || !post) {
    console.error("Post insert error:", insertError);
    return NextResponse.json(
      { error: "Could not save your post. Please try again." },
      { status: 500 }
    );
  }

  /* 6. Update personality_profiles.mood_history (server-side only, per §11) */
  try {
    await appendMoodHistory(user.id, mood_tag);
  } catch (e) {
    // Non-fatal — log and continue
    console.error("mood_history update failed:", e);
  }

  return NextResponse.json(
    { post_id: post.id, ai_companion_message },
    { status: 201 }
  );
}
