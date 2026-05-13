import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/types/database";

const bodySchema = z.object({
  user_id: z.string().uuid(),
});

/* -------------------------------------------------------------------------- */
/*  POST — follow a user                                                        */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user: viewer } } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user_id." }, { status: 400 });
  }
  const { user_id } = parsed.data;

  // Cannot follow yourself
  if (user_id === viewer.id) {
    return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });
  }

  // Insert follow — ignore conflict (already following)
  await supabase
    .from("follows")
    .insert({ follower_id: viewer.id, following_id: user_id })
    .then(undefined, () => undefined); // silence duplicate key errors

  // Update interaction graph: score += 1.0 for following (reflects relationship depth)
  const { data: profile } = await supabase
    .from("personality_profiles")
    .select("interaction_graph")
    .eq("user_id", viewer.id)
    .single();

  const graph = (profile?.interaction_graph as Record<string, number>) ?? {};
  graph[user_id] = (graph[user_id] ?? 0) + 1.0;

  await supabase
    .from("personality_profiles")
    .update({ interaction_graph: graph as unknown as Json })
    .eq("user_id", viewer.id);

  return NextResponse.json({ success: true });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — unfollow a user                                                    */
/* -------------------------------------------------------------------------- */
export async function DELETE(request: Request) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user: viewer } } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user_id." }, { status: 400 });
  }
  const { user_id } = parsed.data;

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", viewer.id)
    .eq("following_id", user_id);

  return NextResponse.json({ success: true });
}
