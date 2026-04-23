-- =============================================================
-- Fix: self-referential RLS on conversation_participants
--
-- Root cause: the SELECT policy on conversation_participants
-- queries the same table it protects. PostgreSQL detects the
-- cycle and breaks it by returning false, so every participant
-- row is invisible → loadData returns 0 convIds → no
-- conversations ever load for the recipient.
--
-- Fix: introduce a SECURITY DEFINER function that reads
-- conversation_participants WITHOUT row security applied,
-- breaking the cycle. All policies now call this function
-- instead of querying the table directly.
-- =============================================================

-- 1. Helper: returns the conversation IDs the current user belongs to,
--    bypassing RLS so the lookup is never recursive.
CREATE OR REPLACE FUNCTION public.my_conversation_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT conversation_id
  FROM   public.conversation_participants
  WHERE  user_id = auth.uid();
$$;

-- 2. conversation_participants policies ------------------------------
DROP POLICY IF EXISTS "participants can view conversation members"
  ON public.conversation_participants;

-- Any participant in a conversation may see ALL rows for that
-- conversation (so the other user's name is visible).
-- Uses the SECURITY DEFINER function — no recursion.
CREATE POLICY "participants can view conversation members"
  ON public.conversation_participants FOR SELECT
  USING (conversation_id IN (SELECT public.my_conversation_ids()));

-- 3. conversations policies -----------------------------------------
DROP POLICY IF EXISTS "participants can view their conversations"
  ON public.conversations;
DROP POLICY IF EXISTS "participants can delete their conversations"
  ON public.conversations;

CREATE POLICY "participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (id IN (SELECT public.my_conversation_ids()));

CREATE POLICY "participants can delete their conversations"
  ON public.conversations FOR DELETE
  USING (id IN (SELECT public.my_conversation_ids()));

-- 4. messages policies ----------------------------------------------
DROP POLICY IF EXISTS "participants can view messages"
  ON public.messages;
DROP POLICY IF EXISTS "users can send messages as themselves"
  ON public.messages;
DROP POLICY IF EXISTS "participants can mark messages read"
  ON public.messages;

CREATE POLICY "participants can view messages"
  ON public.messages FOR SELECT
  USING (conversation_id IN (SELECT public.my_conversation_ids()));

CREATE POLICY "users can send messages as themselves"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (SELECT public.my_conversation_ids())
  );

CREATE POLICY "participants can mark messages read"
  ON public.messages FOR UPDATE
  USING (conversation_id IN (SELECT public.my_conversation_ids()));
