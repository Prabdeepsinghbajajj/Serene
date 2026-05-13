"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FollowButton } from "@/components/profile/follow-button";

export interface UserListRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_following: boolean;
}

interface UserListItemProps {
  user: UserListRow;
  /** When true, hide follow (row is the signed-in user). */
  isSelf: boolean;
}

export function UserListItem({ user, isSelf }: UserListItemProps) {
  const router = useRouter();
  const initials = user.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="link"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-3 border-b border-white/[0.05] py-3 transition-colors hover:bg-white/[0.03]"
      onClick={() => router.push(`/profile/${user.username}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/profile/${user.username}`);
        }
      }}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sage-200/30">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-sans text-xs font-medium text-sage-600">
            {initials}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-semibold text-white/80">
          {user.display_name}
        </p>
        <p className="truncate font-sans text-xs text-white/35">@{user.username}</p>
      </div>
      {!isSelf && (
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FollowButton
            userId={user.id}
            username={user.username}
            initialIsFollowing={user.is_following}
            isOwnProfile={false}
            compact
          />
        </div>
      )}
    </div>
  );
}
