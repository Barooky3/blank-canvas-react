-- Create storage bucket for product images used in emails
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated uploads (for admin)
CREATE POLICY "Allow public uploads to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');