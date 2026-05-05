"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWellness } from "@/hooks/use-wellness";
import type { FeedPost } from "@/types/feed";

/* -------------------------------------------------------------------------- */
/*  Inline leaf icon                                                            */
/* -------------------------------------------------------------------------- */
function LeafIcon({ filled }: { filled: boolean }) {
  const color = filled ? "#8ABD80" : "rgba(245,240,232,0.25)";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#8ABD80" : "none"}
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Relative time                                                               */
/* -------------------------------------------------------------------------- */
function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Media carousel                                                              */
/* -------------------------------------------------------------------------- */
function MediaCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg max-h-96">
        <Image
          src={urls[0]}
          alt={alt}
          width={800}
          height={600}
          className="w-full object-cover rounded-lg max-h-96"
          style={{ maxHeight: "24rem" }}
          unoptimized
        />
        {/* Bottom gradient for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(17,17,16,0.5), transparent)" }} />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-lg">
        <Image
          src={urls[idx]}
          alt={`${alt} ${idx + 1} of ${urls.length}`}
          width={800}
          height={600}
          className="w-full object-cover rounded-lg max-h-96"
          style={{ maxHeight: "24rem" }}
          unoptimized
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(17,17,16,0.5), transparent)" }} />
      </div>

      {idx > 0 && (
        <button
          type="button"
          onClick={() => setIdx((i) => i - 1)}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
          style={{ background: "rgba(0,0,0,0.6)", color: "#F5F0E8" }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      )}
      {idx < urls.length - 1 && (
        <button
          type="button"
          onClick={() => setIdx((i) => i + 1)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
          style={{ background: "rgba(0,0,0,0.6)", color: "#F5F0E8" }}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      <div className="flex justify-center gap-1 mt-2">
        {urls.slice(0, 10).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Image ${i + 1}`}
            className="h-1.5 rounded-full transition-all duration-200 focus:outline-none"
            style={{ width: i === idx ? 16 : 6, background: i === idx ? "#8ABD80" : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Caption                                                                     */
/* -------------------------------------------------------------------------- */
function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > 160;

  return (
    <div className="mt-3">
      <p
        className={`font-sans text-base leading-[1.7] font-[300] ${
          !expanded && needsTruncation ? "line-clamp-3" : ""
        }`}
        style={{ color: "rgba(245,240,232,0.45)" }}
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 font-sans text-sm text-sage-300 hover:text-sage-100 transition-colors focus:outline-none"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* -------------------------------------------------------------------------- */
/*  PostCard                                                                    */
/* -------------------------------------------------------------------------- */
export function PostCard({ post }: { post: FeedPost }) {
  const { recordImpression } = useWellness();
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionFired = useRef(false);

  const [resonated, setResonated] = useState(post.has_resonated);
  const [resonating, setResonating] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || impressionFired.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            if (!impressionFired.current) {
              impressionFired.current = true;
              recordImpression();
            }
          }, 1000);
        } else {
          if (timer) clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [recordImpression]);

  async function handleResonate() {
    if (resonating) return;
    setResonating(true);
    const wasResonated = resonated;
    setResonated(!wasResonated);
    try {
      const res = await fetch("/api/resonance", {
        method: wasResonated ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setResonated(wasResonated);
    } finally {
      setResonating(false);
    }
  }

  const isTextType = post.content_type === "text" || post.content_type === "slow_post";
  const hasMedia = !isTextType && post.media_urls && post.media_urls.length > 0;
  const isVideo = post.content_type === "video" && post.media_urls && post.media_urls.length > 0;
  const altText = post.caption ?? `${post.creator.display_name}'s photo`;
  const initials = post.creator.display_name
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <article
      ref={cardRef}
      className="rounded-xl p-4 sm:p-5 space-y-4 transition-all duration-200 hover:scale-[1.002]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,122,68,0.25)";
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {post.creator.avatar_url && (
            <AvatarImage src={post.creator.avatar_url} alt={post.creator.display_name} />
          )}
          <AvatarFallback
            className="text-xs font-medium"
            style={{ background: "rgba(78,122,68,0.2)", color: "#8ABD80" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold truncate tracking-wide" style={{ color: "rgba(245,240,232,0.70)" }}>
            {post.creator.display_name}
          </p>
        </div>

        {post.mood_tag && (
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-0.5 font-sans text-[0.52rem] font-bold uppercase tracking-[0.12em] flex items-center gap-1"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(245,240,232,0.85)",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "0.4rem" }}>●</span>
            {capitalize(post.mood_tag)}
          </span>
        )}

        <time
          className="flex-shrink-0 font-sans text-xs"
          style={{ color: "rgba(245,240,232,0.25)" }}
          dateTime={post.created_at}
        >
          {relativeTime(post.created_at)}
        </time>
      </div>

      {/* Media */}
      {hasMedia && !isVideo && post.media_urls && (
        <MediaCarousel urls={post.media_urls} alt={altText} />
      )}
      {isVideo && post.media_urls && post.media_urls[0] && (
        <video
          src={post.media_urls[0]}
          controls
          muted
          playsInline
          className="w-full rounded-lg"
          style={{ maxHeight: "20rem" }}
          aria-label={altText}
        />
      )}

      {/* Text post */}
      {isTextType && post.caption && (
        <div className="rounded-lg px-5 py-5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="font-serif italic text-lg leading-relaxed" style={{ color: "rgba(245,240,232,0.7)" }}>
            {post.caption}
          </p>
        </div>
      )}

      {/* Caption for photo/video */}
      {!isTextType && post.caption && <Caption text={post.caption} />}

      {/* AI companion message */}
      {post.ai_companion_message && (
        <div
          className="rounded-lg px-4 py-3 space-y-1.5"
          style={{
            background: "rgba(78,122,68,0.12)",
            borderLeft: "2px solid rgba(138,189,128,0.35)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "rgba(138,189,128,0.6)", flexShrink: 0 }}>
              <path d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z" fill="currentColor" opacity="0.7"/>
              <path d="M12 20V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="font-sans uppercase tracking-[0.2em]" style={{ fontSize: "0.38rem", color: "rgba(138,189,128,0.6)" }}>
              companion
            </p>
          </div>
          <p className="font-display italic leading-[1.6]" style={{ fontSize: "0.9rem", color: "rgba(168,216,158,0.85)" }}>
            {post.ai_companion_message}
          </p>
        </div>
      )}

      {/* Action row */}
      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          type="button"
          onClick={handleResonate}
          disabled={resonating}
          aria-label={resonated ? "Remove resonance" : "Resonate with this post"}
          aria-pressed={resonated}
          className="flex items-center gap-1.5 rounded-lg p-3 -ml-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 disabled:opacity-50"
          style={{ color: resonated ? "#8ABD80" : "rgba(245,240,232,0.25)" }}
        >
          <LeafIcon filled={resonated} />
        </button>

        <button
          type="button"
          aria-label="Comments"
          className="flex items-center gap-1.5 rounded-lg p-3 -mr-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
          style={{ color: "rgba(245,240,232,0.25)" }}
        >
          <MessageCircle size={20} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
