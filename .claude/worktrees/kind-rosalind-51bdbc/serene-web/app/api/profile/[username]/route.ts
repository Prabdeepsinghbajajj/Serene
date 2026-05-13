import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  Public profile shape — never includes wellness_score or daily_session_min */
/* -------------------------------------------------------------------------- */
interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  personality_type: string | null;
  created_at: string;
}

interface PrivateStats {
  follower_count: number;
  following_count: number;
  post_count: number;
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  // 1. Require authentication
  const { data: { user: viewer } } = await supabase.auth.getUser();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2. Fetch profile by username — never select wellness_score or daily_session_minutes (§11)
  const { data: profileRow, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, bio, personality_type, created_at")
    .eq("username", params.username)
    .single();

  if (error || !profileRow) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const profile: PublicProfile = profileRow;
  const isOwnProfile = viewer.id === profile.id;

  // 3. Check if viewer follows this profile
  const { count: followCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", viewer.id)
    .eq("following_id", profile.id);

  const isFollowing = (followCount ?? 0) > 0;

  // 4. Private stats — only returned to the profile owner (§6, §11)
  let privateStats: PrivateStats | undefined;
  if (isOwnProfile) {
    const [followerRes, followingRes, postRes] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_published", true),
    ]);

    privateStats = {
      follower_count: followerRes.count ?? 0,
      following_count: followingRes.count ?? 0,
      post_count: postRes.count ?? 0,
    };
  }

  return NextResponse.json({
    profile,
    is_following: isFollowing,
    is_own_profile: isOwnProfile,
    ...(privateStats ? { private_stats: privateStats } : {}),
  });
}
