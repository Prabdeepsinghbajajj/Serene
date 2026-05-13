"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import type { CommentWithAuthor } from "@/types/comments";

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-2 py-2">
      <div className="h-6 w-6 shrink-0 rounded-full bg-white/[0.08] animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-full max-w-[200px] rounded bg-white/[0.05] animate-pulse" />
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentSection({ postId, isOpen, onClose }: CommentSectionProps) {
  const { profile } = useUser();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?post_id=${encodeURIComponent(postId)}`);
      const data = (await res.json()) as { comments?: CommentWithAuthor[] };
      if (res.ok && data.comments) {
        setComments(data.comments);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!isOpen) return;
    void loadComments();
  }, [isOpen, postId, loadComments]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= 500 && !sending;

  async function handleSend() {
    if (!canSend) return;
    const content = trimmed.slice(0, 500);
    const optimisticId = `optimistic-${Date.now()}`;
    const self = profile;
    if (!self) return;

    const optimistic: CommentWithAuthor = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      user: {
        id: self.id,
        display_name: self.display_name,
        avatar_url: self.avatar_url,
      },
    };

    setComments((c) => [...c, optimistic]);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content }),
      });
      const data = (await res.json()) as { comment?: CommentWithAuthor; error?: string };
      if (!res.ok || !data.comment) {
        setComments((c) => c.filter((x) => x.id !== optimisticId));
        setDraft(content);
        return;
      }
      setComments((c) =>
        c.map((x) => (x.id === optimisticId ? data.comment! : x))
      );
    } catch {
      setComments((c) => c.filter((x) => x.id !== optimisticId));
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (deletingId) return;
    const prev = comments;
    setDeletingId(commentId);
    setComments((c) => c.filter((x) => x.id !== commentId));
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
      if (!res.ok) {
        setComments(prev);
      }
    } catch {
      setComments(prev);
    } finally {
      setDeletingId(null);
    }
  }

  const inputInitials = profile?.display_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <motion.div
      initial={false}
      animate={{
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
      aria-hidden={!isOpen}
    >
      <div
        className="mt-3 flex max-h-[min(70vh,28rem)] flex-col rounded-lg"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-2">
          {loading && comments.length === 0 && (
            <div className="space-y-1">
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="p-4 text-center font-sans text-sm text-white/30">
              Be the first to reply
            </p>
          )}

          {comments.map((c) => {
            const isOwn = profile?.id === c.user.id;
            return (
              <div
                key={c.id}
                className="group flex gap-2 border-b border-white/[0.04] py-2.5 last:border-0"
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                  {c.user.avatar_url ? (
                    <Image
                      src={c.user.avatar_url}
                      alt=""
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-sans text-[0.6rem] text-sage-300">
                      {c.user.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-xs font-semibold text-white/70">
                      {c.user.display_name}
                    </span>
                    <time
                      className="font-sans text-xs text-white/25"
                      dateTime={c.created_at}
                    >
                      {relativeTime(c.created_at)}
                    </time>
                  </div>
                  <p className="mt-0.5 font-sans text-sm font-light text-white/60 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
                {isOwn && !c.id.startsWith("optimistic-") && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
                    disabled={deletingId !== null}
                    className="shrink-0 self-start rounded p-1 text-white/0 transition-colors hover:text-white/30 group-hover:text-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 disabled:opacity-40"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="sticky bottom-0 shrink-0 border-t border-white/[0.06] px-3 py-2.5"
          style={{ background: "rgba(26,26,24,0.98)" }}
        >
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-sans text-[0.6rem] text-sage-300">
                  {inputInitials}
                </span>
              )}
            </div>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              maxLength={500}
              placeholder="Add a reply..."
              className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm text-white/70 outline-none placeholder:text-white/25 focus:outline-none"
              disabled={!profile || sending}
              aria-label="Write a reply"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend || !profile}
              className="shrink-0 rounded-lg p-2 text-sage-300 transition-opacity hover:text-sage-200 disabled:cursor-not-allowed disabled:opacity-25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
              aria-label="Send reply"
            >
              <Send size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
