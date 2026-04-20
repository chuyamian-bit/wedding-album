-- VOWS & VIEWS: DATABASE ARCHITECTURE
-- Copy and paste this into the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ==========================================
-- 1. TABLES
-- ==========================================

-- EVENTS: High-level wedding registry
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL,
  photo_limit integer DEFAULT 500,
  admin_password text, -- Optional for future security
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PHOTOS: The collective memory vault
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  uploader_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. SECURITY (RLS)
-- ==========================================

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Events Policies
CREATE POLICY "Public Events Access" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Event Creation" ON public.events FOR INSERT WITH CHECK (true);

-- Photos Policies
CREATE POLICY "Public Gallery View" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Public Photo Contribution" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Photo Management" ON public.photos FOR DELETE USING (true);

-- ==========================================
-- 3. STORAGE BUCKET CONFIGURATION
-- ==========================================
-- NOTE: You must manually create a bucket named 'photos' in the Supabase Storage UI.
-- Ensure the bucket is set to "Public".

-- Run these to enable storage operations via SQL (replace 'photos' with your bucket name if different)
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Photo Viewing"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

CREATE POLICY "Public Photo Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' );

CREATE POLICY "Admin Storage Cleanup"
ON storage.objects FOR DELETE
USING ( bucket_id = 'photos' );
