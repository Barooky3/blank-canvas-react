CREATE OR REPLACE FUNCTION public.admin_live_counter_calculated_values(_reset_at timestamptz)
RETURNS TABLE(gross numeric, order_count integer, contributing_orders jsonb)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT
      id,
      order_number,
      customer_name,
      customer_email,
      total_amount,
      checkout_reference,
      COALESCE(updated_at, created_at) AS approved_at
    FROM public.orders
    WHERE status = 'approved'
      AND checkout_reference LIKE 'rewarble%'
      AND COALESCE(updated_at, created_at) >= _reset_at
  )
  SELECT
    COALESCE(SUM(total_amount), 0)::numeric AS gross,
    COUNT(*)::integer AS order_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'order_number', order_number,
          'customer_name', customer_name,
          'customer_email', customer_email,
          'total_amount', total_amount,
          'method', CASE
            WHEN checkout_reference LIKE 'rewarble%' THEN 'Rewarble'
            WHEN checkout_reference LIKE 'paypal%' THEN 'PayPal'
            WHEN checkout_reference LIKE 'bank-transfer%' THEN 'Bank Transfer'
            WHEN checkout_reference LIKE 'revolut%' THEN 'Revolut'
            ELSE 'Other'
          END,
          'approvedAt', approved_at
        )
        ORDER BY approved_at DESC
      ),
      '[]'::jsonb
    ) AS contributing_orders
  FROM eligible;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_live_counter_calculated_values(timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_live_counter_calculated_values(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_live_counter_calculated_values(timestamptz) FROM authenticated;

CREATE OR REPLACE FUNCTION public.recalculate_admin_live_counter_before_save()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  calculated record;
BEGIN
  SELECT * INTO calculated
  FROM public.admin_live_counter_calculated_values(NEW.reset_at);

  NEW.gross := COALESCE(calculated.gross, 0);
  NEW.order_count := COALESCE(calculated.order_count, 0);
  NEW.contributing_orders := COALESCE(calculated.contributing_orders, '[]'::jsonb);
  NEW.net := NEW.gross - NEW.ad_spend;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalculate_admin_live_counter_before_save() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_admin_live_counter_before_save() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_admin_live_counter_before_save() FROM authenticated;

DROP TRIGGER IF EXISTS recalculate_admin_live_counter_before_save_trigger ON public.admin_live_counter;
CREATE TRIGGER recalculate_admin_live_counter_before_save_trigger
BEFORE INSERT OR UPDATE ON public.admin_live_counter
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_admin_live_counter_before_save();

CREATE OR REPLACE FUNCTION public.refresh_admin_live_counter_after_order_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_live_counter
  SET updated_at = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_admin_live_counter_after_order_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_admin_live_counter_after_order_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_admin_live_counter_after_order_change() FROM authenticated;

DROP TRIGGER IF EXISTS refresh_admin_live_counter_after_order_change_trigger ON public.orders;
CREATE TRIGGER refresh_admin_live_counter_after_order_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_admin_live_counter_after_order_change();

UPDATE public.admin_live_counter
SET updated_at = now()
WHERE id = 1;