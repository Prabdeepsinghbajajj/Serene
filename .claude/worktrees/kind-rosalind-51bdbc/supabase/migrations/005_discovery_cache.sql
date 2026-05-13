-- Migration 005: discovery cache table + ad category blocking on personality profiles
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS discovery_cache (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  post_ids       text[]   NOT NULL,
  generated_date date     NOT NULL DEFAULT CURRENT_DATE,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, generated_date)
);

ALTER TABLE discovery_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovery_cache_owner_only"
  ON discovery_cache FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_discovery_cache_user_date
  ON discovery_cache(user_id, generated_date);

/* Add blocked_ad_categories column — stores per-user dismissed ad categories (§10) */
ALTER TABLE personality_profiles
  ADD COLUMN IF NOT EXISTS blocked_ad_categories text[] DEFAULT '{}';
