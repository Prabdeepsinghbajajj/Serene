-- Seed: test ad for ethical advertising system
-- Run after migrations in a development environment.

INSERT INTO ads (
  advertiser_name,
  headline,
  body,
  cta_text,
  cta_url,
  allowed_categories,
  personality_tags,
  wellness_tags,
  time_of_day,
  is_active
) VALUES (
  'Headspace',
  'Meditation that actually fits your life',
  'Short, science-backed sessions for real people with real schedules. No app guilt included.',
  'Try free for 7 days',
  'https://www.headspace.com',
  ARRAY['mental_health_apps'],
  ARRAY['intellectual', 'caregiver', 'homebody'],
  ARRAY['mindfulness', 'sleep', 'stress'],
  ARRAY['morning', 'evening'],
  true
)
ON CONFLICT DO NOTHING;
