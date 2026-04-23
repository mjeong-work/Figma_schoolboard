-- =============================================================
-- Events schema: events, event_rsvps, event_likes, event_comments
-- Mirrors the existing posts schema pattern.
-- =============================================================

-- 1. events ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  time        TEXT        NOT NULL,
  venue       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  image_url   TEXT,
  category    TEXT,
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. event_rsvps (participants) --------------------------------
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- 3. event_likes ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_likes (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- 4. event_comments -------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_events_date       ON public.events (date);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user  ON public.event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_event_likes_user  ON public.event_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_ev ON public.event_comments (event_id);

-- 6. RLS ------------------------------------------------------
ALTER TABLE public.events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments  ENABLE ROW LEVEL SECURITY;

-- events: any authenticated user can read; author inserts; author/admin deletes
CREATE POLICY "authenticated users can view events"
  ON public.events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "author or admin can delete events"
  ON public.events FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Administrator'
    )
  );

-- event_rsvps: read all, manage own
CREATE POLICY "authenticated users can view rsvps"
  ON public.event_rsvps FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users can manage own rsvps"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own rsvps"
  ON public.event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- event_likes: read all, manage own
CREATE POLICY "authenticated users can view event likes"
  ON public.event_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users can manage own event likes"
  ON public.event_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own event likes"
  ON public.event_likes FOR DELETE
  USING (auth.uid() = user_id);

-- event_comments: read all, authenticated insert, author/admin delete
CREATE POLICY "authenticated users can view event comments"
  ON public.event_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can add event comments"
  ON public.event_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "author or admin can delete event comments"
  ON public.event_comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Administrator'
    )
  );
