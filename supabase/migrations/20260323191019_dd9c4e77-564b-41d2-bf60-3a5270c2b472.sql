
-- Fake chat conversations (shown to malik as if from real customers)
CREATE TABLE public.fake_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fake_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  hidden boolean NOT NULL DEFAULT false
);

-- Fake chat messages
CREATE TABLE public.fake_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.fake_chat_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'customer',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: deny all client access (only edge functions with service role)
ALTER TABLE public.fake_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fake_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access" ON public.fake_chat_conversations FOR ALL TO public USING (false) WITH CHECK (false);
CREATE POLICY "Deny all client access" ON public.fake_chat_messages FOR ALL TO public USING (false) WITH CHECK (false);

-- Enable realtime for fake chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.fake_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fake_chat_conversations;
