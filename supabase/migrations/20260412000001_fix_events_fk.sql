-- =============================================================
-- Fix: events and event_comments author_id FKs point to
-- auth.users instead of profiles.
--
-- PostgREST resolves "profiles!events_author_id_fkey" by looking
-- for a FK named events_author_id_fkey that targets profiles.
-- When the FK targets auth.users instead, PostgREST returns
-- PGRST200 and fetchEvents() returns early with events=[].
-- =============================================================

ALTER TABLE public.events
  DROP CONSTRAINT events_author_id_fkey,
  ADD CONSTRAINT events_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.event_comments
  DROP CONSTRAINT event_comments_author_id_fkey,
  ADD CONSTRAINT event_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
