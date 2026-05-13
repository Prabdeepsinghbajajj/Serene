-- =============================================================================
-- Migration 001: Initial Schema
-- Serene — run on a fresh Supabase project before any other migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()

-- -----------------------------------------------------------------------------
-- 2. Enum types
-- Using SQL enums for data integrity. More rigid than CHECK constraints but
-- safer for the small, stable value sets in this schema.
-- -----------------------------------------------------------------------------
CREATE TYPE personality_type_enum AS ENUM (
  'creative', 'nature_lover', 'homebody', 'adventurer', 'intellectual', 'caregiver'
);

CREATE TYPE content_type_enum AS ENUM (
  'photo', 'video', 'story', 'text', 'slow_post'
);

CREATE TYPE mood_tag_enum AS ENUM (
  'joyful', 'grateful', 'peaceful', 'reflective', 'creative', 'adventurous'
);

CREATE TYPE wellness_event_type_enum AS ENUM (
  'session_start', 'session_end', 'post_impression', 'rest_nudge_shown',
  'rest_accepted', 'rest_declined', 'daily_limit_reached', 'breathing_completed'
);

-- -----------------------------------------------------------------------------
-- 3. Tables (dependency order — FKs can only reference tables already created)
-- -----------------------------------------------------------------------------

-- users — the root FK target for everything else
CREATE TABLE IF NOT EXISTS public.users (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username              text        UNIQUE NOT NULL,
  display_name          text        NOT NULL,
  avatar_url            text,
  bio                   text,
  personality_type      text        CHECK (personality_type IN (
                                      'creative', 'nature_lover', 'homebody',
                                      'adventurer', 'intellectual', 'caregiver'
                                    )),
  wellness_score        int         DEFAULT 50  CHECK (wellness_score BETWEEN 0 AND 100),
  daily_session_minutes int         DEFAULT 0,
  onboarding_completed  boolean     DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- personality_profiles — 1:1 with users; most sensitive table in the system
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  user_id           uuid        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  interests         text[],
  mood_history      jsonb       DEFAULT '[]',   -- last 30 days only, pruned async
  time_preferences  jsonb       DEFAULT '{}',   -- { morning: [...mood_tags], evening: [...] }
  inferred_values   text[],                     -- health, mindfulness, creativity, connection, nature
  interaction_graph jsonb       DEFAULT '{}',   -- { followed_user_id: score, ... }; server-only, never sent to client
  updated_at        timestamptz DEFAULT now()
);

-- posts
CREATE TABLE IF NOT EXISTS public.posts (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_type         text        CHECK (content_type IN ('photo', 'video', 'story', 'text', 'slow_post')),
  caption              text,
  media_urls           text[],
  mood_tag             text        CHECK (mood_tag IN (
                                     'joyful', 'grateful', 'peaceful',
                                     'reflective', 'creative', 'adventurous'
                                   )),
  ai_sentiment_score   float       CHECK (ai_sentiment_score BETWEEN -1 AND 1),
  ai_companion_message text,
  is_story             boolean     DEFAULT false,
  story_expires_at     timestamptz,
  scheduled_for        timestamptz,
  is_published         boolean     DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()  -- added to support updated_at trigger
);

-- follows — composite PK, no surrogate id
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- resonances (replaces "likes" — no public count exposed by the API)
CREATE TABLE IF NOT EXISTS public.resonances (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- comments
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- wellness_events — append-only; no UPDATE or DELETE permitted by RLS
CREATE TABLE IF NOT EXISTS public.wellness_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type text        NOT NULL CHECK (event_type IN (
                           'session_start', 'session_end', 'post_impression',
                           'rest_nudge_shown', 'rest_accepted', 'rest_declined',
                           'daily_limit_reached', 'breathing_completed'
                         )),
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ads — written by service role only; users can read active ads
CREATE TABLE IF NOT EXISTS public.ads (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name  text        NOT NULL,
  headline         text        NOT NULL,
  body             text,
  cta_text         text,
  cta_url          text,
  image_url        text,
  allowed_categories text[],   -- must be from approved whitelist (enforced by app layer)
  personality_tags text[],
  wellness_tags    text[],
  time_of_day      text[],
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- ad_impressions — owner-only read/write
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES public.users(id),
  ad_id      uuid        REFERENCES public.ads(id),
  dismissed  boolean     DEFAULT false,
  clicked    boolean     DEFAULT false,
  shown_at   timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER personality_profiles_updated_at
  BEFORE UPDATE ON public.personality_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Indexes
-- -----------------------------------------------------------------------------

-- posts — main feed query patterns (bible §8: excludes by created_at, user_id, mood_tag)
CREATE INDEX IF NOT EXISTS idx_posts_user_id      ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_mood_tag      ON public.posts(mood_tag);
-- WELLNESS-CHECK: index is on created_at DESC to efficiently enforce the
-- 48-hour exclusion window required by the feed algorithm (bible §8).
CREATE INDEX IF NOT EXISTS idx_posts_feed ON public.posts(created_at DESC)
  WHERE is_published = true AND is_story = false;

-- follows — forward and reverse lookups for feed scoring
CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- resonances — post-owner count lookup (never exposed publicly)
CREATE INDEX IF NOT EXISTS idx_resonances_post_id ON public.resonances(post_id);
CREATE INDEX IF NOT EXISTS idx_resonances_user_id ON public.resonances(user_id);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id, created_at);

-- wellness_events — daily cap enforcement and session tracking
CREATE INDEX IF NOT EXISTS idx_wellness_events_user_id_created
  ON public.wellness_events(user_id, created_at DESC);

-- ad_impressions — daily frequency cap
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id
  ON public.ad_impressions(user_id, shown_at DESC);
