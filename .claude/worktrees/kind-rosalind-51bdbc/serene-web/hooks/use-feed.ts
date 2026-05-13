"use client";

import { useState, useCallback } from "react";
import type { FeedPost, FeedResponse } from "@/types/feed";

interface UseFeedReturn {
  posts: FeedPost[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  dailyLimitReached: boolean;
  impressionsToday: number;
  error: string | null;
  loadFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  removePost: (postId: string) => void;
  updatePost: (postId: string, patch: Partial<FeedPost>) => void;
}

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [impressionsToday, setImpressionsToday] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed?page=1");
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as FeedResponse;
      setPosts(data.posts);
      setPage(1);
      setHasMore(data.has_more);
      setDailyLimitReached(data.daily_limit_reached);
      setImpressionsToday(data.impressions_today);
    } catch {
      setError("Could not load your feed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const updatePost = useCallback((postId: string, patch: Partial<FeedPost>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
    );
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/feed?page=${nextPage}`);
      if (!res.ok) throw new Error("Failed to load more");
      const data = (await res.json()) as FeedResponse;
      setPosts((prev) => [...prev, ...data.posts]);
      setPage(nextPage);
      setHasMore(data.has_more);
      setDailyLimitReached(data.daily_limit_reached);
      setImpressionsToday(data.impressions_today);
    } catch {
      setError("Could not load more posts.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  return {
    posts,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    dailyLimitReached,
    impressionsToday,
    error,
    loadFeed,
    loadMore,
    removePost,
    updatePost,
  };
}
