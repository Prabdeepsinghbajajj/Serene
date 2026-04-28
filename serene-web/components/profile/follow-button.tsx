"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
}

export function FollowButton({
  userId,
  username,
  initialIsFollowing,
  isOwnProfile,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Own profile: show Edit profile link — no follow affordance
  if (isOwnProfile) {
    return (
      <Link href={`/profile/${username}/edit`}>
        <Button variant="outline" size="sm" className="font-sans">
          Edit profile
        </Button>
      </Link>
    );
  }

  async function handleClick() {
    if (isPending) return;
    setError(null);
    setIsPending(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing); // optimistic

    try {
      const res = await fetch("/api/follow", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("Request failed.");
    } catch {
      setIsFollowing(wasFollowing); // revert
      setError("Something went wrong. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  const showUnfollow = isFollowing && isHovering;

  return (
    <div className="space-y-1">
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        disabled={isPending}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`font-sans transition-colors ${
          showUnfollow
            ? "text-slate-muted border-cream-200"
            : isFollowing
            ? "text-sage-600 border-sage-200"
            : ""
        }`}
        aria-label={isFollowing ? "Unfollow this person" : "Follow this person"}
      >
        {showUnfollow ? "Unfollow" : isFollowing ? "Following" : "Follow"}
      </Button>

      {error && (
        <p className="font-sans text-xs text-amber-warm">{error}</p>
      )}
    </div>
  );
}
