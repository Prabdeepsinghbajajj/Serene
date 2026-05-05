import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/types/database";
import type { CommentWithAuthor } from "@/types/comments";

const postIdQuery = z.string().uuid();

const postBodySchema = z.object({
  post_id: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Content is required.")
    .max(500, "Content must be at most 500 characters."),
});

const deleteBodySchema = z.object({
  comment_id: z.string().uuid(),
});

const commentSelect = `
  id,
  content,
  created_at,
  user:users!comments_user_id_fkey (
    id,
    display_name,
    avatar_url
  )
`;

function mapCommentRow(
  row: {
    id: string;
    content: string;
    created_at: string;
    user:
      | { id: string; display_name: string; avatar_url: string | null }
      | { id: string; display_name: string; avatar_url: string | null }[]
      | null;
  }
): CommentWithAuthor | null {
  const u = Array.isArray(row.user) ? row.user[0] : row.user;
  if (!u) return null;
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    user: {
      id: u.id,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  GET — comments for a post                                                 */
/* -------------------------------------------------------------------------- */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const parsedId = postIdQuery.safeParse(searchParams.get("post_id") ?? "");
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid or missing post_id.", comments: [] },
      { status: 400 }
    );
  }
  const postId = parsedId.data;

  const { data, error } = await supabase
    .from("comments")
    .select(commentSelect)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load comments.", comments: [] },
      { status: 500 }
    );
  }

  const comments: CommentWithAuthor[] = [];
  for (const row of data ?? []) {
    const mapped = mapCommentRow(row as Parameters<typeof mapCommentRow>[0]);
    if (mapped) comments.push(mapped);
  }

  return NextResponse.json({ comments });
}

/* -------------------------------------------------------------------------- */
/*  POST — add a comment + interaction graph                                  */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
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

  const parsed = postBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { post_id, content } = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("comments")
    .insert({
      post_id,
      user_id: viewer.id,
      content,
    })
    .select(commentSelect)
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "Could not post comment." },
      { status: 400 }
    );
  }

  const comment = mapCommentRow(inserted as Parameters<typeof mapCommentRow>[0]);
  if (!comment) {
    return NextResponse.json(
      { error: "Could not load new comment." },
      { status: 500 }
    );
  }

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", post_id)
    .single();

  if (post && post.user_id !== viewer.id) {
    const { data: profile } = await supabase
      .from("personality_profiles")
      .select("interaction_graph")
      .eq("user_id", viewer.id)
      .single();

    const graph = (profile?.interaction_graph as Record<string, number>) ?? {};
    graph[post.user_id] = (graph[post.user_id] ?? 0) + 1.5;

    await supabase
      .from("personality_profiles")
      .update({ interaction_graph: graph as unknown as Json })
      .eq("user_id", viewer.id);
  }

  return NextResponse.json({ comment });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — own comment only (API contract)                                  */
/* -------------------------------------------------------------------------- */
export async function DELETE(request: Request) {
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

  const parsed = deleteBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment_id." }, { status: 400 });
  }
  const { comment_id } = parsed.data;

  const { data: deleted, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment_id)
    .eq("user_id", viewer.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true as const });
}
