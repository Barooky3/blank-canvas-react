
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_url text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload proof" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Anyone can read proof" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
