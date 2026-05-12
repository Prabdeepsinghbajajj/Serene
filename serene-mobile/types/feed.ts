import type { MoodTag, ContentType } from './database'

export interface FeedCreator {
  id: string
  display_name: string
  avatar_url: string | null
}

export interface FeedPost {
  id: string
  user_id: string
  content_type: ContentType | null
  caption: string | null
  media_urls: string[] | null
  mood_tag: MoodTag | null
  ai_sentiment_score: number | null
  ai_companion_message: string | null
  is_story: boolean
  story_expires_at: string | null
  scheduled_for: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  creator: FeedCreator
  has_resonated: boolean
  resonance_count?: number
}

export interface FeedResponse {
  posts: FeedPost[]
  page: number
  has_more: boolean
  daily_limit_reached: boolean
  impressions_today: number
}
