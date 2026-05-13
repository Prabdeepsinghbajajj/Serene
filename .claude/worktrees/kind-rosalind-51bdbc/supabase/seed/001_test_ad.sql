/* Test ad seed — development only
   Run in Supabase SQL Editor AFTER running migrations 001-006.
   Matches the allowed-category whitelist exactly (bible §10). */

INSERT INTO ads (
  advertiser_name,
  headline,
  body,
  cta_text,
  cta_url,
  allowed_categories,
  personality_tags,
  wellness_tags,
  is_active
) VALUES (
  'Headspace',
  'A few minutes of calm',
  'Guided meditation and sleep tools to help you feel more like yourself.',
  'Try it free',
  'https://headspace.com',
  ARRAY['mental_health_apps', 'sleep_aids'],
  ARRAY['homebody', 'intellectual', 'caregiver'],
  ARRAY['mindfulness', 'sleep'],
  true
);
