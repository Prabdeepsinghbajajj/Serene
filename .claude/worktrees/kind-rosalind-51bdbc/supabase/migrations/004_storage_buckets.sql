-- Migration 004: Storage buckets for post media
-- Run this in the Supabase SQL Editor after migration 003.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  524288000, -- 500 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
);

-- ----------------------------------------------------------------
-- RLS policies for the posts bucket
-- ----------------------------------------------------------------

-- Anyone can read post media (posts bucket is public)
CREATE POLICY "posts_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

-- Only the owning user can upload (folder must match their user_id)
CREATE POLICY "posts_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only the owning user can delete their own media
CREATE POLICY "posts_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'posts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
