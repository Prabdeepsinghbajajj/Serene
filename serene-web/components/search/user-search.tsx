"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import type { SearchUser } from "@/types/search";

const DEBOUNCE_MS = 400;

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.08] animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-28 max-w-full rounded bg-white/[0.08] animate-pulse" />
        <div className="h-3 w-20 max-w-full rounded bg-white/[0.05] animate-pulse" />
      </div>
      <div className="h-7 w-16 shrink-0 rounded-full bg-white/[0.06] animate-pulse" />
    </div>
  );
}

function FollowToggle({
  userId,
  initialFollowing,
  onChange,
}: {
  userId: string;
  initialFollowing: boolean;
  onChange: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, userId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !following;
    setPending(true);
    setFollowing(next);
    onChange(next);
    try {
      const res = await fetch("/api/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setFollowing(!next);
      onChange(!next);
    } finally {
      setPending(false);
    }
  }

  const showUnfollow = following && hover;
  const label = showUnfollow ? "Unfollow" : following ? "Following" : "Follow";

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={pending}
      className="shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 disabled:opacity-50"
      style={
        following
          ? {
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: showUnfollow ? "rgba(245,240,232,0.55)" : "rgba(138,189,128,0.9)",
            }
          : {
              background: "linear-gradient(135deg, #5E9A52, #3A6032)",
              border: "1px solid rgba(78,122,68,0.35)",
              color: "#F5F0E8",
            }
      }
    >
      {label}
    </button>
  );
}

interface UserSearchProps {
  className?: string;
  /** Larger input for mobile overlay */
  inputSize?: "default" | "large";
  /** Focus search input on mount (e.g. overlay open) */
  autoFocus?: boolean;
  /** Called after navigating to a profile (e.g. close mobile overlay) */
  onAfterNavigate?: () => void;
}

export function UserSearch({
  className = "",
  inputSize = "default",
  autoFocus = false,
  onAfterNavigate,
}: UserSearchProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          { signal: ac.signal }
        );
        const data = (await res.json()) as { users?: SearchUser[] };
        if (!res.ok) {
          setResults([]);
          setSearched(true);
          return;
        }
        setResults(data.users ?? []);
        setSearched(true);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setResults([]);
        setSearched(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const showDropdown = open && query.trim().length >= 2;

  const updateFollowing = useCallback((userId: string, isFollowing: boolean) => {
    setResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_following: isFollowing } : u))
    );
  }, []);

  function handleRowClick(u: SearchUser) {
    setOpen(false);
    router.push(`/profile/${u.username}`);
    onAfterNavigate?.();
  }

  const inputPad = inputSize === "large" ? "py-3.5 pl-11 pr-4 text-base" : "py-2 pl-9 pr-3 text-sm";
  const iconLeft = inputSize === "large" ? "left-3.5" : "left-2.5";
  const iconSize = inputSize === "large" ? 18 : 16;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={iconSize}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/30 ${iconLeft}`}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people..."
          autoComplete="off"
          className={`w-full rounded-full border border-white/[0.08] bg-[rgba(255,255,255,0.06)] font-sans text-[#F5F0E8] placeholder:text-white/25 outline-none transition-colors focus:border-sage-300/40 ${inputPad}`}
        />
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#222220] shadow-2xl"
          role="list"
          aria-label="Search results"
        >
          {loading && (
            <div className="py-2 space-y-1">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <p className="px-4 py-8 text-center font-sans text-sm text-white/30">
              No people found
            </p>
          )}

          {!loading &&
            results.map((u) => (
              <div
                key={u.id}
                role="listitem"
                tabIndex={0}
                className="flex cursor-pointer items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 last:border-0 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                onClick={() => handleRowClick(u)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(u);
                  }
                }}
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                  {u.avatar_url ? (
                    <Image
                      src={u.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-sans text-xs text-sage-300">
                      {u.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm text-cream/80">
                    {u.display_name}
                  </p>
                  <p className="truncate font-sans text-xs text-white/40">
                    @{u.username}
                  </p>
                </div>
                <FollowToggle
                  userId={u.id}
                  initialFollowing={u.is_following}
                  onChange={(f) => updateFollowing(u.id, f)}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
