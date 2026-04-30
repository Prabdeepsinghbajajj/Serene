"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Companion } from "@/components/ui/typography";
import { useWellness } from "@/hooks/use-wellness";
import type { FeedPost } from "@/types/feed";

/* -------------------------------------------------------------------------- */
/*  Inline leaf SVG (never from lucide — avoids any count/metric associations) */
/* -------------------------------------------------------------------------- */
function LeafIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 22C7 22 3 17.5 3 12C3 6.5 7.5 2 12 2C16.5 2 21 6.5 21 12C21 17.5 17 22 12 22Z"
        fill={filled ? "#87AA7E" : "none"}
        stroke={filled ? "#87AA7E" : "#ADADAA"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 21C12 21 12 9 12 4"
        stroke={filled ? "#4E7A44" : "#ADADAA"}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Relative time formatter                                                     */
/* -------------------------------------------------------------------------- */
function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Image carousel for multiple media                                           */
/* -------------------------------------------------------------------------- */
function MediaCarousel({
  urls,
  alt,
}: {
  urls: string[];
  alt: string;
}) {
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
      </div>

      {/* Prev / next arrows */}
      {idx > 0 && (
        <button
          type="button"
          onClick={() => setIdx((i) => i - 1)}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/80 text-sage-600 shadow-sm opacity-0 hover:opacity-100 focus:opacity-100 sm:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
      )}
      {idx < urls.length - 1 && (
        <button
          type="button"
          onClick={() => setIdx((i) => i + 1)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/80 text-sage-600 shadow-sm opacity-0 hover:opacity-100 focus:opacity-100 sm:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      {/* Dot indicators (max 10) */}
      <div className="flex justify-center gap-1 mt-2">
        {urls.slice(0, 10).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Image ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-200 focus:outline-none ${
              i === idx ? "w-4 bg-sage-400" : "w-1.5 bg-cream-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Caption with expand/collapse                                                */
/* -------------------------------------------------------------------------- */
function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > 160;

  return (
    <div className="mt-3">
      <p
        className={`font-sans text-base text-slate-warm leading-[1.7] ${
          !expanded && needsTruncation ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 font-sans text-sm text-sage-600 hover:text-sage-800 transition-colors focus:outline-none"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mood tag label                                                              */
/* -------------------------------------------------------------------------- */
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

  // Optimistic resonance state
  const [resonated, setResonated] = useState(post.has_resonated);
  const [resonating, setResonating] = useState(false);

  /* IntersectionObserver — fire impression once when 50% visible for 1s */
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
    setResonated(!wasResonated); // optimistic

    try {
      const res = await fetch("/api/resonance", {
        method: wasResonated ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setResonated(wasResonated); // revert on error
    } finally {
      setResonating(false);
    }
  }

  const isTextType =
    post.content_type === "text" || post.content_type === "slow_post";
  const hasMedia =
    !isTextType && post.media_urls && post.media_urls.length > 0;
  const isVideo =
    post.content_type === "video" &&
    post.media_urls &&
    post.media_urls.length > 0;

  const altText = post.caption ?? `${post.creator.display_name}'s photo`;
  const initials = post.creator.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      ref={cardRef}
      className="rounded-xl border border-cream-200 bg-card p-4 sm:p-6 space-y-4 transition-all duration-200 hover:scale-[1.002] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)]"
    >
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          {post.creator.avatar_url && (
            <AvatarImage
              src={post.creator.avatar_url}
              alt={post.creator.display_name}
            />
          )}
          <AvatarFallback className="bg-sage-100 text-sage-800 text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-medium text-slate-warm truncate tracking-[0.01em]">
            {post.creator.display_name}
          </p>
        </div>

        {post.mood_tag && (
          <span className="flex-shrink-0 rounded-full bg-sage-100 px-2.5 py-0.5 font-sans text-xs font-medium text-sage-600 tracking-[0.08em] flex items-center gap-1">
            <span aria-hidden="true" className="text-[8px] leading-none">●</span>
            {capitalize(post.mood_tag)}
          </span>
        )}

        <time
          className="flex-shrink-0 font-sans text-xs text-slate-hint"
          dateTime={post.created_at}
        >
          {relativeTime(post.created_at)}
        </time>
      </div>

      {/* ---- Media ---- */}
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

      {/* ---- Text content ---- */}
      {isTextType && post.caption && (
        <div className="rounded-lg bg-cream-100 p-6">
          <p className="font-serif italic text-lg text-slate-warm leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* ---- Caption (for photo/video) ---- */}
      {!isTextType && post.caption && <Caption text={post.caption} />}

      {/* ---- AI companion message ---- */}
      {post.ai_companion_message && (
        <div className="rounded-lg bg-sage-100 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            {/* Inline leaf — keeps companion note visually grounded (§6) */}
            <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0 text-sage-400">
              <path
                d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z"
                fill="currentColor"
                opacity="0.5"
              />
              <path
                d="M12 20V9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
            <p className="font-sans text-xs text-slate-hint uppercase tracking-wide">
              A note from your companion
            </p>
          </div>
          <Companion>{post.ai_companion_message}</Companion>
        </div>
      )}

      {/* ---- Action row — NO counts (bible §6) ---- */}
      <div className="flex items-center justify-between pt-1">
        {/* 44px touch target via p-3 */}
        <button
          type="button"
          onClick={handleResonate}
          disabled={resonating}
          aria-label={resonated ? "Remove resonance" : "Resonate with this post"}
          aria-pressed={resonated}
          className="flex items-center gap-1.5 rounded-lg p-3 -ml-3 transition-colors hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 disabled:opacity-50"
        >
          <LeafIcon filled={resonated} />
        </button>

        {/* Comment icon — expand inline section in Phase 2 */}
        <button
          type="button"
          aria-label="Comments"
          className="flex items-center gap-1.5 rounded-lg p-3 -mr-3 text-slate-hint transition-colors hover:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
        >
          <MessageCircle size={20} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
