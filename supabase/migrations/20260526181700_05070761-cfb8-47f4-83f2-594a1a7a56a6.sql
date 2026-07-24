
-- Unschedule any cron jobs related to fake-chat-auto / chat
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job
           WHERE jobname ILIKE '%fake_chat%' OR jobname ILIKE '%fake-chat%' OR jobname ILIKE '%chat%' OR command ILIKE '%fake-chat-auto%' OR command ILIKE '%admin-chat%'
  LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop chat-related triggers/functions
DROP FUNCTION IF EXISTS public.unhide_conversation_on_message() CASCADE;
DROP FUNCTION IF EXISTS public.auto_block_ordered_customer_messages() CASCADE;

-- Drop all chat tables and their data
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.fake_chat_messages CASCADE;
DROP TABLE IF EXISTS public.fake_chat_conversations CASCADE;
DROP TABLE IF EXISTS public.fake_chat_auto_state CASCADE;
