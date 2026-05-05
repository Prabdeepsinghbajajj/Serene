"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PostDetailSheet } from "@/components/post/post-detail-sheet";
import { useUser } from "@/context/user-context";
import type { ProfilePostGridItem } from "@/app/api/profile/[username]/posts/route";

/* -------------------------------------------------------------------------- */
/*  Mood tag → emoji map                                                        */
/* -------------------------------------------------------------------------- */
const MOOD_EMOJI: Record<string, string> = {
  joyful: "✨",
  grateful: "🌿",
  peaceful: "🌊",
  reflective: "🍂",
  creative: "🎨",
  adventurous: "⛰️",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton — 9 squares                                               */
/* -------------------------------------------------------------------------- */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-sm" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Single grid cell                                                            */
/* -------------------------------------------------------------------------- */
function GridCell({
  post,
  onOpen,
}: {
  post: ProfilePostGridItem;
  onOpen: (postId: string) => void;
}) {
  const isText =
    post.content_type === "text" || post.content_type === "slow_post";
  const coverUrl = post.media_urls?.[0] ?? null;
  const emoji =
    post.mood_tag ? (MOOD_EMOJI[post.mood_tag] ?? "🌱") : "🌱";

  function handleOpen() {
    onOpen(post.id);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
      aria-label={`View post`}
      className="relative aspect-square w-full rounded-sm overflow-hidden bg-cream-100 cursor-pointer transition-[filter] duration-150 hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
    >
      {!isText && coverUrl ? (
        <Image
          src={coverUrl}
          alt="Post thumbnail"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 33vw, 200px"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-cream-100">
          <span className="text-2xl" aria-hidden="true">
            {emoji}
          </span>
          {post.content_type === "slow_post" && (
            <span
              className="absolute bottom-1.5 right-1.5 text-xs"
              aria-hidden="true"
            >
              🌱
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PostGrid                                                                    */
/* -------------------------------------------------------------------------- */
interface PostGridProps {
  username: string;
  isOwnProfile: boolean;
}

interface FetchState {
  posts: ProfilePostGridItem[];
  hasMore: boolean;
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export function PostGrid({ username, isOwnProfile }: PostGridProps) {
  const { profile } = useUser();
  const [sheetPostId, setSheetPostId] = useState<string | null>(null);
  const [state, setState] = useState<FetchState>({
    posts: [],
    hasMore: false,
    page: 1,
    isLoading: true,
    isLoadingMore: false,
    error: null,
  });

  const fetchPage = useCallback(
    async (page: number, append = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !append,
        isLoadingMore: append,
        error: null,
      }));

      try {
        const res = await fetch(
          `/api/profile/${encodeURIComponent(username)}/posts?page=${page}`
        );
        if (!res.ok) throw new Error("Failed to load posts.");
        const data = await res.json() as {
          posts: ProfilePostGridItem[];
          has_more: boolean;
        };
        setState((prev) => ({
          ...prev,
          posts: append ? [...prev.posts, ...data.posts] : data.posts,
          hasMore: data.has_more,
          page,
          isLoading: false,
          isLoadingMore: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Could not load posts.",
          isLoading: false,
          isLoadingMore: false,
        }));
      }
    },
    [username]
  );

  useEffect(() => {
    fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (state.isLoading) return <GridSkeleton />;

  if (state.error) {
    return (
      <div className="py-12 text-center font-sans text-sm text-slate-muted">
        {state.error}
      </div>
    );
  }

  if (state.posts.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 px-4">
        <p className="font-sans text-base text-slate-muted">
          {isOwnProfile
            ? "You haven\u2019t shared anything yet."
            : "Nothing shared yet."}
        </p>
        {isOwnProfile && (
          <Link href="/create">
            <Button variant="outline" size="sm" className="font-sans">
              Share your first moment
            </Button>
          </Link>
        )}
      </div>
    );
  }

  function removePostFromGrid(postId: string) {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {state.posts.map((post) => (
            <GridCell key={post.id} post={post} onOpen={setSheetPostId} />
          ))}
        </div>

        {state.hasMore && (
          <div className="px-4 pt-2">
            <Button
              variant="outline"
              className="w-full font-sans"
              disabled={state.isLoadingMore}
              onClick={() => fetchPage(state.page + 1, true)}
            >
              {state.isLoadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>

      <PostDetailSheet
        postId={sheetPostId}
        onClose={() => setSheetPostId(null)}
        currentUserId={profile?.id}
        onPostDeleted={removePostFromGrid}
      />
    </>
  );
}
