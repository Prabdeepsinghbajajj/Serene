"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useFeed } from "@/hooks/use-feed";
import { PostCard } from "@/components/feed/post-card";
import { useUser } from "@/context/user-context";
import type { MoodTag } from "@/types/database";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { Button } from "@/components/ui/button";
import { Heading, Body } from "@/components/ui/typography";

/* -------------------------------------------------------------------------- */
/*  Time-based greeting — client only to avoid hydration mismatch             */
/* -------------------------------------------------------------------------- */
function FeedGreeting() {
  const [greeting, setGreeting] = useState<{ text: string; date: string } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const text =
      hour < 5
        ? "It's late. Rest is part of the practice."
        : hour < 12
        ? "Good morning. What's worth sharing today?"
        : hour < 18
        ? "Good afternoon. How are you feeling?"
        : "Good evening. You've done enough today.";
    const date = hour >= 5 ? new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) : "";
    setGreeting({ text, date });
  }, []);

  if (!greeting) return null;

  return (
    <div className="mb-6">
      <p className="font-display italic text-lg" style={{ color: "rgba(245,240,232,0.35)" }}>{greeting.text}</p>
      <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.18)" }}>{greeting.date}</p>
    </div>
  );
}

function LeafEmpty() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 70 C20 70 10 55 10 38 C10 20 25 8 40 8 C55 8 70 20 70 38 C70 55 60 70 40 70Z"
        fill="#C9DBC2"
        opacity="0.6"
      />
      <path
        d="M40 68 C40 68 40 25 40 12"
        stroke="#87AA7E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function EndOfFeed() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-slate-hint">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z"
          fill="#C9DBC2"
          opacity="0.7"
        />
        <path
          d="M12 20V9"
          stroke="#87AA7E"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      <span className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.25)" }}>
        You&apos;ve seen what matters. The rest can wait.
      </span>
    </div>
  );
}

export default function FeedPage() {
  const { profile } = useUser();
  const {
    posts,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadFeed,
    loadMore,
    removePost,
    updatePost,
  } = useFeed();

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
      <FeedGreeting />

      {/* Loading */}
      {isLoading && <FeedSkeleton />}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-xl bg-cream-100 border border-cream-200 px-6 py-8 text-center space-y-4">
          <Body muted>Something went wrong loading your feed.</Body>
          <Button variant="outline" size="sm" onClick={loadFeed}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center text-center pt-16 pb-8 space-y-4">
          <LeafEmpty />
          <Heading as="h2" size="md">
            Your feed is quiet
          </Heading>
          <Body muted>Follow some people to fill your space.</Body>
        </div>
      )}

      {/* Feed list */}
      {!isLoading && posts.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <PostCard
                  post={post}
                  currentUserId={profile?.id}
                  onDeleted={() => removePost(post.id)}
                  onEdited={(caption, moodTag) =>
                    updatePost(post.id, {
                      caption: caption.length ? caption : null,
                      mood_tag: moodTag as MoodTag,
                    })
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load more — never auto-loads (bible §7 / wellness philosophy) */}
          {hasMore && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}

          {!hasMore && <EndOfFeed />}
        </motion.div>
      )}
    </div>
  );
}
