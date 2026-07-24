
-- Add hidden_from_admin column for soft-delete
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS hidden_from_admin boolean NOT NULL DEFAULT false;

-- Trigger: when a new message is inserted, unhide the conversation for admin
CREATE OR REPLACE FUNCTION public.unhide_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET hidden_from_admin = false, updated_at = now()
  WHERE id = NEW.conversation_id AND hidden_from_admin = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_unhide_on_new_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.unhide_conversation_on_message();
