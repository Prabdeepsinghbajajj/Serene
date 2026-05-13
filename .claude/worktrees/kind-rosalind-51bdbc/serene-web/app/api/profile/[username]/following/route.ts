import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface FollowingListUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_following: boolean;
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
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

  const { data: profileRow } = await supabase
    .from("users")
    .select("id")
    .eq("username", params.username)
    .single();

  if (!profileRow) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const profileId = profileRow.id;

  const [listRes, countRes] = await Promise.all([
    supabase
      .from("follows")
      .select(
        `
        created_at,
        users!follows_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("follower_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);

  if (listRes.error) {
    return NextResponse.json(
      { error: "Failed to load following.", following: [], total: 0 },
      { status: 500 }
    );
  }

  const rows = (listRes.data ?? []) as Array<{
    users:
      | { id: string; username: string; display_name: string; avatar_url: string | null }
      | { id: string; username: string; display_name: string; avatar_url: string | null }[]
      | null;
  }>;
  const following: FollowingListUser[] = [];
  const ids: string[] = [];

  for (const row of rows) {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    if (!u) continue;
    ids.push(u.id);
    following.push({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      is_following: false,
    });
  }

  if (ids.length > 0) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewer.id)
      .in("following_id", ids);

    const set = new Set(followRows?.map((r) => r.following_id) ?? []);
    for (const f of following) {
      f.is_following = set.has(f.id);
    }
  }

  return NextResponse.json({
    following,
    total: countRes.count ?? following.length,
  });
}
