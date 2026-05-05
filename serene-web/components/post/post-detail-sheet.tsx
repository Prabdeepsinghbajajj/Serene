"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import type { FeedPost } from "@/types/feed";
import type { MoodTag } from "@/types/database";

interface PostDetailSheetProps {
  postId: string | null;
  onClose: () => void;
  currentUserId: string | null | undefined;
  onPostDeleted?: (postId: string) => void;
}

export function PostDetailSheet({
  postId,
  onClose,
  currentUserId,
  onPostDeleted,
}: PostDetailSheetProps) {
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/posts/${postId}`)
      .then(async (res) => {
        const data = (await res.json()) as { post?: FeedPost };
        if (!res.ok) throw new Error("failed");
        if (!cancelled) setPost(data.post ?? null);
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <AnimatePresence>
      {postId && (
        <>
          <motion.button
            type="button"
            aria-label="Close post"
            className="fixed inset-0 z-40 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed z-50 flex flex-col overflow-hidden bg-[#1A1A18] shadow-2xl md:right-0 md:top-0 md:bottom-0 md:w-[480px] md:border-l md:border-white/[0.07] max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90vh] max-md:rounded-t-2xl max-md:border-t max-md:border-white/[0.07]"
            initial={mobile ? { y: "100%" } : { x: 480 }}
            animate={mobile ? { y: 0 } : { x: 0 }}
            exit={mobile ? { y: "100%" } : { x: 480 }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex shrink-0 items-center justify-end border-b border-white/[0.06] px-3 py-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                aria-label="Close"
              >
                <X size={22} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="space-y-3 py-8">
                  <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
                  <div className="h-48 w-full animate-pulse rounded-lg bg-white/[0.05]" />
                </div>
              )}
              {!loading && post && (
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  skipWellnessTracking
                  onDeleted={() => {
                    onPostDeleted?.(post.id);
                    onClose();
                  }}
                  onEdited={(caption, moodTag) => {
                    setPost((p) =>
                      p
                        ? {
                            ...p,
                            caption: caption || null,
                            mood_tag: moodTag as MoodTag,
                          }
                        : null
                    );
                  }}
                />
              )}
              {!loading && !post && (
                <p className="py-12 text-center font-sans text-sm text-white/40">
                  Could not load this post.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
