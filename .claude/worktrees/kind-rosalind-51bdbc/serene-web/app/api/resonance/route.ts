import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/types/database";

const bodySchema = z.object({
  post_id: z.string().uuid(),
});

/* -------------------------------------------------------------------------- */
/*  POST — add resonance                                                        */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post_id." }, { status: 400 });
  }
  const { post_id } = parsed.data;

  // Insert — ignore conflict (already resonated)
  await supabase
    .from("resonances")
    .insert({ post_id, user_id: user.id })
    .throwOnError()
    .then(undefined, () => undefined); // silence duplicate key errors

  // Find post owner to update interaction graph (score += 1.5 for comment/resonance)
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", post_id)
    .single();

  if (post) {
    const { data: profile } = await supabase
      .from("personality_profiles")
      .select("interaction_graph")
      .eq("user_id", user.id)
      .single();

    const graph = (profile?.interaction_graph as Record<string, number>) ?? {};
    graph[post.user_id] = (graph[post.user_id] ?? 0) + 1.5;

    await supabase
      .from("personality_profiles")
      .update({ interaction_graph: graph as unknown as Json })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — remove resonance                                                   */
/* -------------------------------------------------------------------------- */
export async function DELETE(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post_id." }, { status: 400 });
  }
  const { post_id } = parsed.data;

  await supabase
    .from("resonances")
    .delete()
    .eq("post_id", post_id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
