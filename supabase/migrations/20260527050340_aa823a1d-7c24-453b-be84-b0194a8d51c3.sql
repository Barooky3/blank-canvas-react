
-- Add images column to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];

-- Create public storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated users can upload to their own folder, admin can manage all
CREATE POLICY "Review images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin can manage all review images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'review-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK (bucket_id = 'review-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');
