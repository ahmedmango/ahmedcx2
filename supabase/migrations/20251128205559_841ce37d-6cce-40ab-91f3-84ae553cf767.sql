-- Add storage bucket for epigram images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epigram-images',
  'epigram-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Create storage policies for public read
CREATE POLICY "Anyone can view epigram images"
ON storage.objects FOR SELECT
USING (bucket_id = 'epigram-images');

-- Create storage policies for authenticated insert
CREATE POLICY "Anyone can upload epigram images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'epigram-images');

-- Add image_url column to epigrams table
ALTER TABLE epigrams
ADD COLUMN image_url text;