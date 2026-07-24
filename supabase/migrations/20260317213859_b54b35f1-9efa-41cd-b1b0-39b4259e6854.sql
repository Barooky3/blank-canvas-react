
-- Fix 1: Drop public RLS policies on email_otps (all operations handled by edge functions with service role)
DROP POLICY IF EXISTS "Anyone can verify OTP" ON public.email_otps;
DROP POLICY IF EXISTS "Anyone can create OTP" ON public.email_otps;
DROP POLICY IF EXISTS "Anyone can mark OTP used" ON public.email_otps;

-- Fix 2: Drop public policies on payment-proofs storage bucket
DROP POLICY IF EXISTS "Anyone can upload proof" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read proof" ON storage.objects;

-- Fix 3: Restrict product-images uploads to authenticated users only
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
