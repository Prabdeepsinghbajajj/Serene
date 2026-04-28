import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/*  Grid-safe post shape — no captions, no companion messages in grid view     */
/* -------------------------------------------------------------------------- */
export interface ProfilePostGridItem {
  id: string;
  content_type: string | null;
  media_urls: string[] | null;
  mood_tag: string | null;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { data: { user: viewer } } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Resolve username → id
  const { data: profileRow } = await supabase
    .from("users")
    .select("id")
    .eq("username", params.username)
    .single();

  if (!profileRow) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Fetch published posts — grid columns only, never captions/companion msgs (§11)
  const { data: posts, count } = await supabase
    .from("posts")
    .select("id, content_type, media_urls, mood_tag, created_at", { count: "exact" })
    .eq("user_id", profileRow.id)
    .eq("is_published", true)
    .eq("is_story", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const total = count ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  return NextResponse.json({
    posts: (posts ?? []) as ProfilePostGridItem[],
    has_more: hasMore,
    total_count: total,
  });
}
