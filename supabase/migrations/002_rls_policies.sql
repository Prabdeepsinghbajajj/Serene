-- =============================================================================
-- Migration 002: Row Level Security Policies
-- Run immediately after 001_initial_schema.sql.
-- Every table must have RLS enabled before going to production.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS on every table
-- -----------------------------------------------------------------------------
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resonances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions     ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- users
-- Public safe-column reads; owner-only writes.
-- NOTE: personality_type and wellness_score are on this table but must NOT be
-- included in any public-facing SELECT — the app layer uses a view or selects
-- only safe columns. See bible §11.
-- -----------------------------------------------------------------------------
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled by the auth trigger in migration 003 — no user-facing INSERT policy.

-- -----------------------------------------------------------------------------
-- posts
-- Authenticated users can read published posts from people they follow,
-- plus their own posts (including drafts/unpublished).
-- WELLNESS-CHECK: SELECT is scoped to follows + own posts to prevent strangers'
-- content unexpectedly appearing, which supports the relationship-depth weighting
-- in the feed algorithm (bible §8).
-- -----------------------------------------------------------------------------
CREATE POLICY "posts_select_feed"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND (
      user_id = auth.uid()
      OR user_id IN (
        SELECT following_id FROM public.follows WHERE follower_id = auth.uid()
      )
    )
  );

CREATE POLICY "posts_select_own_all"
  ON public.posts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- follows
-- -----------------------------------------------------------------------------
CREATE POLICY "follows_select_authenticated"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- -----------------------------------------------------------------------------
-- resonances
-- Any authenticated user can see resonances (needed for post author to see
-- their own counts). Public count is never exposed — the API layer controls
-- what is returned to non-owners (bible §6).
-- -----------------------------------------------------------------------------
CREATE POLICY "resonances_select_authenticated"
  ON public.resonances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "resonances_insert_own"
  ON public.resonances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resonances_delete_own"
  ON public.resonances FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
CREATE POLICY "comments_select_authenticated"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Comment author can delete their own; post owner can delete any on their post.
CREATE POLICY "comments_delete_own_or_post_owner"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR post_id IN (
      SELECT id FROM public.posts WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- wellness_events — append-only, owner-only, never public
-- WELLNESS-CHECK: No UPDATE or DELETE policy is intentional — these records are
-- the source of truth for session tracking and must not be retroactively altered.
-- -----------------------------------------------------------------------------
CREATE POLICY "wellness_events_select_own"
  ON public.wellness_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "wellness_events_insert_own"
  ON public.wellness_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No UPDATE or DELETE policy — wellness events are immutable once written.

-- -----------------------------------------------------------------------------
-- personality_profiles
-- CRITICAL: personality data — owner only, never relax this policy.
-- This is the most sensitive table in the system (bible §11).
-- The interaction_graph and mood_history must NEVER be sent to any client
-- other than the owning user, and even then only the server should process them.
-- -----------------------------------------------------------------------------
CREATE POLICY "personality_profiles_all_own" -- CRITICAL: personality data — owner only, never relax this
  ON public.personality_profiles
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- ads — public read for active ads; all writes are service-role only
-- -----------------------------------------------------------------------------
CREATE POLICY "ads_select_active"
  ON public.ads FOR SELECT
  TO authenticated
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE policy for authenticated users — service role bypasses RLS.

-- -----------------------------------------------------------------------------
-- ad_impressions — owner only read/write
-- UPDATE is permitted for dismissed and clicked flag updates only.
-- The server never needs to read another user's impression history.
-- -----------------------------------------------------------------------------
CREATE POLICY "ad_impressions_select_own"
  ON public.ad_impressions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ad_impressions_insert_own"
  ON public.ad_impressions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ad_impressions_update_own"
  ON public.ad_impressions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No DELETE policy — impression history is retained for fraud prevention and billing accuracy.
