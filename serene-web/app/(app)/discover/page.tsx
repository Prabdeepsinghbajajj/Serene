"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/feed/post-card";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { EthicalAdCard } from "@/components/ads/ethical-ad-card";
import { UserSearch } from "@/components/search/user-search";
import type { FeedPost } from "@/types/feed";
import type { ServedAd } from "@/types/ads";

/* -------------------------------------------------------------------------- */
/*  Small leaf SVG for empty/end states                                        */
/* -------------------------------------------------------------------------- */
function LeafSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  );
}

function LeafIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 56C20 56 10 46 10 32C10 18 20 8 32 8C44 8 54 18 54 32C54 46 44 56 32 56Z"
        fill="#C9DBC2"
        opacity="0.5"
      />
      <path
        d="M32 54V18"
        stroke="#87AA7E"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ad slot — lazy-loads when the 5th card scrolls into view                  */
/* -------------------------------------------------------------------------- */
function AdSlot() {
  const ref = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<ServedAd | null | "loading" | "none">("loading");
  const fetched = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetched.current) {
          fetched.current = true;
          fetch("/api/ads/next")
            .then((r) => r.json())
            .then((data: { ad: ServedAd | null }) => {
              setAd(data.ad ?? "none");
            })
            .catch(() => setAd("none"));
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {ad === "loading" || ad === "none" || ad === null ? null : (
        <EthicalAdCard
          ad={ad}
          onDismiss={() => setAd("none")}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Discover page                                                               */
/* -------------------------------------------------------------------------- */
interface DiscoverResponse {
  posts: FeedPost[];
  refreshes_at: string;
}

export default function DiscoverPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [refreshesAt, setRefreshesAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySeen, setAlreadySeen] = useState(false);

  useEffect(() => {
    // Check if we already fetched today (client-side guard to detect cached response)
    const todayKey = new Date().toISOString().split("T")[0];
    const seenKey = `serene_discover_seen_${todayKey}`;
    const wasSeen = typeof window !== "undefined" && !!sessionStorage.getItem(seenKey);
    if (wasSeen) setAlreadySeen(true);

    fetch("/api/discover")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load.");
        return res.json() as Promise<DiscoverResponse>;
      })
      .then((data) => {
        setPosts(data.posts);
        setRefreshesAt(data.refreshes_at);
        // Mark as seen for this session
        if (typeof window !== "undefined") {
          sessionStorage.setItem(seenKey, "1");
        }
      })
      .catch(() => setError("Couldn't load today's picks. Try again later."))
      .finally(() => setIsLoading(false));
  }, []);

  function formatMidnight(iso: string | null): string {
    if (!iso) return "midnight";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <h1 className="font-display text-3xl font-[300]" style={{ color: "#F5F0E8" }}>
          Today&apos;s discoveries
        </h1>
        <p className="font-sans text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
          Refreshes at midnight{refreshesAt ? ` · ${formatMidnight(refreshesAt)}` : ""}
        </p>
      </div>

      {/* Already seen banner */}
      {alreadySeen && !isLoading && (
        <div className="mb-4 rounded-lg px-4 py-3" style={{ background: "rgba(78,122,68,0.12)", border: "1px solid rgba(78,122,68,0.2)" }}>
          <p className="font-sans text-sm" style={{ color: "rgba(138,189,128,0.8)" }}>
            You&apos;ve already explored today&apos;s picks.
          </p>
        </div>
      )}

      <section className="mb-6 space-y-3">
        <h2 className="font-sans text-sm font-medium uppercase tracking-wider text-white/50">
          Find people
        </h2>
        <UserSearch className="w-full max-w-md" />
        <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
      </section>

      {isLoading && <FeedSkeleton />}

      {!isLoading && error && (
        <div className="py-12 text-center">
          <p className="font-sans text-base" style={{ color: "rgba(245,240,232,0.4)" }}>{error}</p>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center text-center pt-16 space-y-4">
          <LeafIllustration />
          <h2 className="font-display text-xl font-[300]" style={{ color: "#F5F0E8" }}>Check back tomorrow</h2>
          <p className="font-sans text-base" style={{ color: "rgba(245,240,232,0.40)" }}>New discoveries arrive each day.</p>
        </div>
      )}

      {!isLoading && posts.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {posts.map((post, idx) => (
            <div key={post.id}>
              <PostCard post={post} />
              {idx === 4 && <div className="mt-4"><AdSlot /></div>}
            </div>
          ))}

          <div className="flex items-center justify-center gap-2 py-8" style={{ color: "rgba(245,240,232,0.20)" }}>
            <LeafSmall />
            <span className="font-sans text-sm">
              That&apos;s today&apos;s discovery. Come back tomorrow for more.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
