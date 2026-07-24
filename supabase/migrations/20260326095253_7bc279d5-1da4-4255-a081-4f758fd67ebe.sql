
ALTER TABLE public.fake_chat_conversations 
ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reply_due_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_auto_question_at timestamp with time zone DEFAULT NULL;

-- Single-row state table for global auto scheduling
CREATE TABLE IF NOT EXISTS public.fake_chat_auto_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  next_question_at timestamp with time zone NOT NULL DEFAULT (now() + interval '25 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fake_chat_auto_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access" ON public.fake_chat_auto_state FOR ALL TO public USING (false) WITH CHECK (false);

-- Insert initial state row
INSERT INTO public.fake_chat_auto_state (next_question_at) VALUES (now() + interval '25 minutes');
