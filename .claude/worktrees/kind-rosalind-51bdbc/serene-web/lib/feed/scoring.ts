import type { FeedPost } from "@/types/feed";

/* -------------------------------------------------------------------------- */
/*  Mood → time-of-day affinity map  (bible §8)                               */
/* -------------------------------------------------------------------------- */
export const MOOD_TIME_MAP: Record<string, string[]> = {
  morning: ["joyful", "creative", "adventurous"],
  afternoon: ["creative", "adventurous", "grateful"],
  evening: ["peaceful", "reflective", "grateful"],
  late_night: ["peaceful", "reflective"],
};

export function getTimeOfDay():
  | "morning"
  | "afternoon"
  | "evening"
  | "late_night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "late_night";
}

/* -------------------------------------------------------------------------- */
/*  Individual scoring functions                                                */
/* -------------------------------------------------------------------------- */

/** Mood-time fit: 0.0–1.0. Combines current time-of-day map + user preferences. */
export function scoreMoodTime(
  moodTag: string | null,
  timeOfDay: string,
  preferredMoods: string[]
): number {
  if (!moodTag) return 0.5; // neutral when no tag
  const timeMoods = MOOD_TIME_MAP[timeOfDay] ?? [];
  const inTimeMap = timeMoods.includes(moodTag) ? 0.5 : 0;
  const inPreferred = preferredMoods.includes(moodTag) ? 0.5 : 0;
  return Math.min(1, inTimeMap + inPreferred);
}

/** Recency: linear decay from 1.0 (just posted) to 0.0 at 48 hours. */
export function scoreRecency(createdAt: string): number {
  const hoursAgo =
    (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return Math.max(0, 1 - hoursAgo / 48);
}

/**
 * Relationship depth: maps raw interaction graph score (0–∞) to 0.0–1.0.
 * Cap normalised at 20 interaction points (above that, score stays at 1.0).
 */
export function scoreRelationship(
  postUserId: string,
  interactionGraph: Record<string, number>
): number {
  const raw = interactionGraph[postUserId] ?? 0;
  return Math.min(1, raw / 20);
}

/**
 * Serendipity: deterministic pseudo-random seeded by postId + userId +
 * today's date. Stable within a day (won't reshuffle on refresh), changes
 * daily — bible §8 "seeded by user_id + date".
 */
export function stableSerendipity(postId: string, userId: string): number {
  const seed = `${postId}-${userId}-${new Date().toDateString()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }
  return (Math.abs(hash) % 1000) / 1000;
}

/* -------------------------------------------------------------------------- */
/*  Final composite score  (weights from bible §8)                            */
/* -------------------------------------------------------------------------- */
export function computeFinalScore(params: {
  relationshipScore: number;
  moodScore: number;
  recencyScore: number;
  serendipity: number;
}): number {
  return (
    params.relationshipScore * 0.4 +
    params.moodScore * 0.3 +
    params.recencyScore * 0.2 +
    params.serendipity * 0.1
  );
}

/* -------------------------------------------------------------------------- */
/*  Diversity filter  (bible §8: max 2 consecutive posts from same creator)   */
/* -------------------------------------------------------------------------- */
export function applyDiversityFilter(posts: FeedPost[]): FeedPost[] {
  const result: FeedPost[] = [];
  let lastCreatorId = "";
  let consecutiveCount = 0;

  for (const post of posts) {
    if (post.creator.id === lastCreatorId) {
      consecutiveCount++;
      if (consecutiveCount >= 2) continue; // skip — would make 3+ consecutive
    } else {
      lastCreatorId = post.creator.id;
      consecutiveCount = 1;
    }
    result.push(post);
  }
  return result;
}
