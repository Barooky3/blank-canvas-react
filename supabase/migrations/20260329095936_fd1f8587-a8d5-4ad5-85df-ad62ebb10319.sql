CREATE OR REPLACE FUNCTION public.auto_block_ordered_customer_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sender_type != 'customer' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM chat_conversations cc
    JOIN orders o ON lower(o.customer_email) = lower(cc.user_email)
    WHERE cc.id = NEW.conversation_id
      AND o.created_at < now() - interval '5 hours'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_block_ordered_customers
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_block_ordered_customer_messages();