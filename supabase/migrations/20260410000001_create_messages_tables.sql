-- =============================================================
-- Messages schema: conversations, participants, messages
-- =============================================================

-- 1. conversations -----------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  context_type    TEXT        CHECK (context_type IN ('marketplace', 'event')),
  context_item_id TEXT,
  context_item_title TEXT
);

-- 2. conversation_participants -----------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  user_name       TEXT NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- 3. messages ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name     TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  image_url       TEXT,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for query performance -------------------------
CREATE INDEX IF NOT EXISTS idx_conv_participants_user
  ON public.conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created
  ON public.messages (created_at);

-- 5. Enable realtime change tracking ----------------------
-- Required for postgres_changes subscriptions
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Row Level Security ------------------------------------
ALTER TABLE public.conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                 ENABLE ROW LEVEL SECURITY;

-- conversations: only participants can see / delete
CREATE POLICY "participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "participants can delete their conversations"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

-- conversation_participants: visible to anyone in the same conversation
CREATE POLICY "participants can view conversation members"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants AS cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- messages: visible to conversation participants; sender must be self
CREATE POLICY "participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "users can send messages as themselves"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "participants can mark messages read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );
