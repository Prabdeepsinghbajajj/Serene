import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Sanitize search query — allows letters, numbers, spaces, hyphen, underscore, apostrophe.
 * Strips characters that could break filter strings or widen search unexpectedly.
 */
function sanitizeSearchQuery(raw: string): string {
  return raw.trim().slice(0, 80).replace(/[^a-zA-Z0-9 _'\-]/g, "");
}

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

/* -------------------------------------------------------------------------- */
/*  GET /api/search?q=…  — find users by username or display_name (min 2 chars) */
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
  const raw = searchParams.get("q") ?? "";
  const q = sanitizeSearchQuery(raw);

  if (q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters.", users: [] },
      { status: 400 }
    );
  }

  const pattern = `%${q}%`;
  const selectCols = "id, username, display_name, avatar_url, bio";

  const [{ data: byUsername, error: errUser }, { data: byDisplayName, error: errName }] =
    await Promise.all([
      supabase
        .from("users")
        .select(selectCols)
        .ilike("username", pattern)
        .neq("id", viewer.id)
        .limit(10),
      supabase
        .from("users")
        .select(selectCols)
        .ilike("display_name", pattern)
        .neq("id", viewer.id)
        .limit(10),
    ]);

  if (errUser || errName) {
    return NextResponse.json(
      { error: "Search failed.", users: [] },
      { status: 500 }
    );
  }

  const merged = new Map<string, UserRow>();
  for (const row of [...(byUsername ?? []), ...(byDisplayName ?? [])]) {
    merged.set(row.id, row as UserRow);
  }
  const list = Array.from(merged.values()).slice(0, 10);

  if (list.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const ids = list.map((u) => u.id);

  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewer.id)
    .in("following_id", ids);

  const followingSet = new Set(
    (followRows ?? []).map((r) => r.following_id)
  );

  const users = list.map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    avatar_url: u.avatar_url,
    bio: u.bio,
    is_following: followingSet.has(u.id),
  }));

  return NextResponse.json({ users });
}
