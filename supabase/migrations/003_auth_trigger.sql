-- =============================================================================
-- Migration 003: Auth Trigger
-- Creates a users row and personality_profiles row automatically whenever
-- a new account is created via Supabase Auth (email or OAuth).
-- Run after 001 and 002.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the public user profile row
  INSERT INTO public.users (id, username, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    -- Prefer an explicit username passed via metadata; fall back to a
    -- deterministic slug so the username UNIQUE constraint never fires.
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',    -- populated by Google OAuth
      NEW.raw_user_meta_data->>'display_name', -- populated by email signup
      'New member'
    ),
    false  -- onboarding_completed: user must complete onboarding flow
  );

  -- Create the private personality profile row with empty defaults.
  -- The interaction_graph, mood_history, etc. are populated async by Edge Functions.
  INSERT INTO public.personality_profiles (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER ensures this function runs as the table owner, not the
-- calling role, allowing the insert into public.users from the auth schema.

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
