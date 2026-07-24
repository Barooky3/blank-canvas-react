
-- Create orders table to store order data before payment
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_reference TEXT NOT NULL UNIQUE,
  sumup_checkout_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB,
  order_items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  discount_code TEXT,
  discount_percent INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access, no public access needed
-- Orders are created and managed entirely by edge functions
CREATE POLICY "Service role full access on orders"
ON public.orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
