"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Body } from "@/components/ui/typography";
import { FollowButton } from "@/components/profile/follow-button";
import { PostGrid } from "@/components/profile/post-grid";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
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

interface ProfileResponse {
  profile: PublicProfile;
  is_following: boolean;
  is_own_profile: boolean;
  private_stats?: PrivateStats;
}

/* -------------------------------------------------------------------------- */
/*  Header skeleton                                                             */
/* -------------------------------------------------------------------------- */
function ProfileHeaderSkeleton() {
  return (
    <div className="flex gap-4 items-start pt-8 px-4 pb-6">
      <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full max-w-xs mt-2" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile page                                                                */
/* -------------------------------------------------------------------------- */
export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setError(null);

    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error("error");
        return res.json() as Promise<ProfileResponse>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message === "not_found" ? "not_found" : "error"))
      .finally(() => setIsLoading(false));
  }, [username]);

  /* Loading */
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto">
        <ProfileHeaderSkeleton />
        <div className="border-t border-cream-200 mt-2">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 p-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Error / not found */
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto pt-20 text-center px-4 space-y-4">
        <Heading as="h1" size="md">
          {error === "not_found" ? "Profile not found" : "Something went wrong"}
        </Heading>
        <Link
          href="/feed"
          className="font-sans text-sm text-sage-600 hover:underline"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  const { profile, is_following, is_own_profile, private_stats } = data;
  const initials = profile.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-xl mx-auto">
      {/* ---- Profile header ---- */}
      <div className="px-4 pt-8 pb-4 space-y-4">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <Avatar className="h-20 w-20 flex-shrink-0">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            )}
            <AvatarFallback className="bg-sage-200 text-sage-800 font-sans text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name + username + follow button */}
          <div className="flex-1 min-w-0 space-y-1 pt-1">
            <h1 className="font-serif text-2xl font-[500] text-slate-warm leading-tight truncate">
              {profile.display_name}
            </h1>
            <p className="font-sans text-sm text-slate-muted">
              @{profile.username}
            </p>

            <div className="pt-2">
              <FollowButton
                userId={profile.id}
                username={profile.username}
                initialIsFollowing={is_following}
                isOwnProfile={is_own_profile}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Body className="text-slate-warm line-clamp-2">{profile.bio}</Body>
        )}

        {/*
          Private stats — only rendered when viewer IS the owner (§6, §11).
          NEVER shown to visitors. Lock icon signals these are private.
        */}
        {is_own_profile && private_stats && (
          <div className="flex items-center gap-1.5 pt-1">
            <Lock size={12} className="text-slate-hint flex-shrink-0" aria-hidden="true" />
            <p className="font-sans text-sm text-slate-muted">
              {private_stats.post_count} post
              {private_stats.post_count !== 1 ? "s" : ""}{" "}
              &middot;{" "}
              {private_stats.follower_count} follower
              {private_stats.follower_count !== 1 ? "s" : ""}{" "}
              &middot;{" "}
              {private_stats.following_count} following
            </p>
          </div>
        )}
      </div>

      {/* ---- Divider ---- */}
      <div className="border-t border-cream-200" />

      {/* ---- Post grid ---- */}
      <div className="pt-2">
        <PostGrid username={username} isOwnProfile={is_own_profile} />
      </div>
    </div>
  );
}
