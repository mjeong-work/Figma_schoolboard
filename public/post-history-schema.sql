-- ============================================================
-- post_history table for Community post edits
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_history (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id        uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  edited_by      uuid        NOT NULL REFERENCES public.profiles(id),
  edited_at      timestamptz NOT NULL DEFAULT now(),
  prev_title     text,
  prev_content   text,
  prev_image_url text,
  prev_category  text
);

CREATE INDEX IF NOT EXISTS post_history_post_id_idx  ON public.post_history(post_id);
CREATE INDEX IF NOT EXISTS post_history_edited_at_idx ON public.post_history(edited_at DESC);

ALTER TABLE public.post_history ENABLE ROW LEVEL SECURITY;

-- Post author and admins can read history for their posts
CREATE POLICY "Post authors and admins can read post history"
  ON public.post_history FOR SELECT
  USING (
    edited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrator')
  );

-- Authenticated users insert history for posts they are allowed to edit
CREATE POLICY "Authenticated users can insert post history"
  ON public.post_history FOR INSERT
  WITH CHECK (auth.uid() = edited_by);
