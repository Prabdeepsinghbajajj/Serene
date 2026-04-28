import type { Post, User } from "@/types/database";

export interface FeedPost extends Post {
  /** Minimal creator info joined server-side — never includes private fields */
  creator: Pick<User, "id" | "display_name" | "avatar_url">;
  /** Whether the requesting user has resonated with this post */
  has_resonated: boolean;
  /**
   * Resonance count — only populated when the requesting user is the post
   * owner. Never sent to other users (bible §6: no public counts).
   */
  resonance_count?: number;
}

export interface FeedResponse {
  posts: FeedPost[];
  page: number;
  has_more: boolean;
  /** True when the user has hit their 30-post daily cap (bible §7) */
  daily_limit_reached: boolean;
  /** Number of post impressions logged today for the requesting user */
  impressions_today: number;
}
