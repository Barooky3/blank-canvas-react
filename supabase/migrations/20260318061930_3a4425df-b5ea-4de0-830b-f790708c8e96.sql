-- 1. Fix chat_conversations: restrict UPDATE to only customer_last_seen_at
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

CREATE POLICY "Users can update own conversation last seen"
  ON public.chat_conversations
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND blocked = (SELECT cc.blocked FROM public.chat_conversations cc WHERE cc.id = chat_conversations.id)
    AND hidden_from_admin = (SELECT cc.hidden_from_admin FROM public.chat_conversations cc WHERE cc.id = chat_conversations.id)
    AND status = (SELECT cc.status FROM public.chat_conversations cc WHERE cc.id = chat_conversations.id)
    AND user_id = (SELECT cc.user_id FROM public.chat_conversations cc WHERE cc.id = chat_conversations.id)
    AND user_email = (SELECT cc.user_email FROM public.chat_conversations cc WHERE cc.id = chat_conversations.id)
  );

-- 2. Make payment-proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';