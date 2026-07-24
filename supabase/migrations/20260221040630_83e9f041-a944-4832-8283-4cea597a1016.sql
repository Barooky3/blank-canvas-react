
-- Add approval_token column for secure approve/reject links
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approval_token text;
