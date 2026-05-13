// This file mirrors the shape that `npx supabase gen types typescript --local` produces.
// Hand-written until a live Supabase project is connected.
// When you connect your project, regenerate with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      /* ------------------------------------------------------------------ */
      /*  users                                                               */
      /* ------------------------------------------------------------------ */
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          personality_type:
            | "creative"
            | "nature_lover"
            | "homebody"
            | "adventurer"
            | "intellectual"
            | "caregiver"
            | null;
          wellness_score: number;
          daily_session_minutes: number;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          personality_type?:
            | "creative"
            | "nature_lover"
            | "homebody"
            | "adventurer"
            | "intellectual"
            | "caregiver"
            | null;
          wellness_score?: number;
          daily_session_minutes?: number;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          personality_type?:
            | "creative"
            | "nature_lover"
            | "homebody"
            | "adventurer"
            | "intellectual"
            | "caregiver"
            | null;
          wellness_score?: number;
          daily_session_minutes?: number;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      /* ------------------------------------------------------------------ */
      /*  posts                                                               */
      /* ------------------------------------------------------------------ */
      posts: {
        Row: {
          id: string;
          user_id: string;
          content_type:
            | "photo"
            | "video"
            | "story"
            | "text"
            | "slow_post"
            | null;
          caption: string | null;
          media_urls: string[] | null;
          mood_tag:
            | "joyful"
            | "grateful"
            | "peaceful"
            | "reflective"
            | "creative"
            | "adventurous"
            | null;
          ai_sentiment_score: number | null;
          ai_companion_message: string | null;
          is_story: boolean;
          story_expires_at: string | null;
          scheduled_for: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type?:
            | "photo"
            | "video"
            | "story"
            | "text"
            | "slow_post"
            | null;
          caption?: string | null;
          media_urls?: string[] | null;
          mood_tag?:
            | "joyful"
            | "grateful"
            | "peaceful"
            | "reflective"
            | "creative"
            | "adventurous"
            | null;
          ai_sentiment_score?: number | null;
          ai_companion_message?: string | null;
          is_story?: boolean;
          story_expires_at?: string | null;
          scheduled_for?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?:
            | "photo"
            | "video"
            | "story"
            | "text"
            | "slow_post"
            | null;
          caption?: string | null;
          media_urls?: string[] | null;
          mood_tag?:
            | "joyful"
            | "grateful"
            | "peaceful"
            | "reflective"
            | "creative"
            | "adventurous"
            | null;
          ai_sentiment_score?: number | null;
          ai_companion_message?: string | null;
          is_story?: boolean;
          story_expires_at?: string | null;
          scheduled_for?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  follows                                                             */
      /* ------------------------------------------------------------------ */
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  resonances                                                          */
      /* ------------------------------------------------------------------ */
      resonances: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resonances_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resonances_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  comments                                                            */
      /* ------------------------------------------------------------------ */
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  wellness_events                                                     */
      /* ------------------------------------------------------------------ */
      wellness_events: {
        Row: {
          id: string;
          user_id: string;
          event_type:
            | "session_start"
            | "session_end"
            | "post_impression"
            | "rest_nudge_shown"
            | "rest_accepted"
            | "rest_declined"
            | "daily_limit_reached"
            | "breathing_completed"
            | "companion_message"
            | "discovery_impression";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type:
            | "session_start"
            | "session_end"
            | "post_impression"
            | "rest_nudge_shown"
            | "rest_accepted"
            | "rest_declined"
            | "daily_limit_reached"
            | "breathing_completed"
            | "companion_message"
            | "discovery_impression";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?:
            | "session_start"
            | "session_end"
            | "post_impression"
            | "rest_nudge_shown"
            | "rest_accepted"
            | "rest_declined"
            | "daily_limit_reached"
            | "breathing_completed"
            | "companion_message"
            | "discovery_impression";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wellness_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  personality_profiles  (CRITICAL — owner-only RLS)                 */
      /* ------------------------------------------------------------------ */
      personality_profiles: {
        Row: {
          user_id: string;
          interests: string[] | null;
          mood_history: Json;
          time_preferences: Json;
          inferred_values: string[] | null;
          interaction_graph: Json;
          blocked_ad_categories: string[] | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          interests?: string[] | null;
          mood_history?: Json;
          time_preferences?: Json;
          inferred_values?: string[] | null;
          interaction_graph?: Json;
          blocked_ad_categories?: string[] | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          interests?: string[] | null;
          mood_history?: Json;
          time_preferences?: Json;
          inferred_values?: string[] | null;
          interaction_graph?: Json;
          blocked_ad_categories?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personality_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  discovery_cache  (owner-only RLS, one row per user per day)       */
      /* ------------------------------------------------------------------ */
      discovery_cache: {
        Row: {
          id: string;
          user_id: string;
          post_ids: string[];
          generated_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_ids: string[];
          generated_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_ids?: string[];
          generated_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discovery_cache_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ------------------------------------------------------------------ */
      /*  ads                                                                 */
      /* ------------------------------------------------------------------ */
      ads: {
        Row: {
          id: string;
          advertiser_name: string;
          headline: string;
          body: string | null;
          cta_text: string | null;
          cta_url: string | null;
          image_url: string | null;
          allowed_categories: string[] | null;
          personality_tags: string[] | null;
          wellness_tags: string[] | null;
          time_of_day: string[] | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_name: string;
          headline: string;
          body?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          image_url?: string | null;
          allowed_categories?: string[] | null;
          personality_tags?: string[] | null;
          wellness_tags?: string[] | null;
          time_of_day?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_name?: string;
          headline?: string;
          body?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          image_url?: string | null;
          allowed_categories?: string[] | null;
          personality_tags?: string[] | null;
          wellness_tags?: string[] | null;
          time_of_day?: string[] | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      /* ------------------------------------------------------------------ */
      /*  ad_impressions                                                      */
      /* ------------------------------------------------------------------ */
      ad_impressions: {
        Row: {
          id: string;
          user_id: string | null;
          ad_id: string | null;
          dismissed: boolean;
          clicked: boolean;
          shown_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          ad_id?: string | null;
          dismissed?: boolean;
          clicked?: boolean;
          shown_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          ad_id?: string | null;
          dismissed?: boolean;
          clicked?: boolean;
          shown_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_impressions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_impressions_ad_id_fkey";
            columns: ["ad_id"];
            referencedRelation: "ads";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;

    Enums: {
      personality_type:
        | "creative"
        | "nature_lover"
        | "homebody"
        | "adventurer"
        | "intellectual"
        | "caregiver";
      content_type: "photo" | "video" | "story" | "text" | "slow_post";
      mood_tag:
        | "joyful"
        | "grateful"
        | "peaceful"
        | "reflective"
        | "creative"
        | "adventurous";
      wellness_event_type:
        | "session_start"
        | "session_end"
        | "post_impression"
        | "rest_nudge_shown"
        | "rest_accepted"
        | "rest_declined"
        | "daily_limit_reached"
        | "breathing_completed"
        | "companion_message"
        | "discovery_impression";
    };
  };
}

/* -------------------------------------------------------------------------- */
/*  Convenience row-type aliases                                               */
/* -------------------------------------------------------------------------- */
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Resonance = Database["public"]["Tables"]["resonances"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type WellnessEvent =
  Database["public"]["Tables"]["wellness_events"]["Row"];
export type PersonalityProfile =
  Database["public"]["Tables"]["personality_profiles"]["Row"];
export type Ad = Database["public"]["Tables"]["ads"]["Row"];
export type AdImpression =
  Database["public"]["Tables"]["ad_impressions"]["Row"];

/* -------------------------------------------------------------------------- */
/*  Enum type aliases                                                          */
/* -------------------------------------------------------------------------- */
export type PersonalityType = Database["public"]["Enums"]["personality_type"];
export type ContentType = Database["public"]["Enums"]["content_type"];
export type MoodTag = Database["public"]["Enums"]["mood_tag"];
export type WellnessEventType =
  Database["public"]["Enums"]["wellness_event_type"];
