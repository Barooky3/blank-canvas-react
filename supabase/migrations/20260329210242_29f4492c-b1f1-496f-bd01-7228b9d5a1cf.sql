CREATE OR REPLACE FUNCTION public.auto_block_ordered_customer_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.sender_type != 'customer' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM chat_conversations cc
    JOIN orders o ON lower(o.customer_email) = lower(cc.user_email)
    WHERE cc.id = NEW.conversation_id
      AND o.created_at < now() - interval '24 hours'
      AND o.status = 'approved'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;