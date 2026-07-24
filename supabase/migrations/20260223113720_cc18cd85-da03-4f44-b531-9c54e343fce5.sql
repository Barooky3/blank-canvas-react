
-- Add order_number column with auto-incrementing sequence starting from 1002
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1002;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INTEGER UNIQUE DEFAULT nextval('public.order_number_seq');

-- Set order_number for any existing orders that don't have one
UPDATE public.orders SET order_number = nextval('public.order_number_seq') WHERE order_number IS NULL;
