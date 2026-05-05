"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserListItem } from "@/components/profile/user-list-item";
import { useUser } from "@/context/user-context";
import type { UserListRow } from "@/components/profile/user-list-item";

interface FollowingResponse {
  following: UserListRow[];
  total: number;
  error?: string;
}

function ListSkeleton() {
  return (
    <div className="space-y-0 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-white/[0.05] py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FollowingPage() {
  const params = useParams();
  const username = params.username as string;
  const { profile } = useUser();
  const [data, setData] = useState<FollowingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    fetch(`/api/profile/${encodeURIComponent(username)}/following`)
      .then(async (res) => {
        const json = (await res.json()) as FollowingResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setData(json);
      })
      .catch(() => setError("Could not load following."))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <Link
        href={`/profile/${encodeURIComponent(username)}`}
        className="mb-6 inline-flex items-center gap-2 font-sans text-sm text-white/50 underline-offset-2 transition-colors hover:text-sage-300 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to profile
      </Link>

      <h1
        className="mb-6 font-display text-3xl font-[300] text-cream"
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        Following
      </h1>

      {loading && <ListSkeleton />}

      {!loading && error && (
        <p className="py-8 text-center font-sans text-sm text-white/40">{error}</p>
      )}

      {!loading && !error && data && data.following.length === 0 && (
        <p className="py-12 text-center font-sans text-sm text-white/30">
          Not following anyone yet.
        </p>
      )}

      {!loading && !error && data && data.following.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] px-2">
          {data.following.map((u) => (
            <UserListItem
              key={u.id}
              user={u}
              isSelf={profile?.id === u.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
