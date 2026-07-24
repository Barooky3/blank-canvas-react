
-- Fix product_padding_overrides: restrict write access to admin-only (via edge functions)
DROP POLICY IF EXISTS "Authenticated users can insert padding overrides" ON public.product_padding_overrides;
DROP POLICY IF EXISTS "Authenticated users can update padding overrides" ON public.product_padding_overrides;

-- Fix handle_new_user: add length limit to full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 100)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
