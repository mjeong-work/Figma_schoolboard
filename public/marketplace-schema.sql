-- ============================================================
-- Marketplace schema for figma_schoolboard
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. marketplace_items table
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  category    text        NOT NULL,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  condition   text        NOT NULL,
  description text        NOT NULL,
  image_url   text,
  seller_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact     text        NOT NULL,
  views       integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. marketplace_saves (like post_likes — one row per user per item)
CREATE TABLE IF NOT EXISTS public.marketplace_saves (
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id)           ON DELETE CASCADE,
  PRIMARY KEY (item_id, user_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS marketplace_items_seller_id_idx  ON public.marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS marketplace_items_created_at_idx ON public.marketplace_items(created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_saves_user_id_idx    ON public.marketplace_saves(user_id);

-- 4. RLS
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saves ENABLE ROW LEVEL SECURITY;

-- marketplace_items policies
CREATE POLICY "Authenticated users can read marketplace items"
  ON public.marketplace_items FOR SELECT USING (true);

CREATE POLICY "Users can insert their own marketplace items"
  ON public.marketplace_items FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Authors and admins can update marketplace items"
  ON public.marketplace_items FOR UPDATE
  USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrator')
  )
  WITH CHECK (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrator')
  );

CREATE POLICY "Authors and admins can delete marketplace items"
  ON public.marketplace_items FOR DELETE
  USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrator')
  );

-- marketplace_saves policies
CREATE POLICY "Authenticated users can read saves"
  ON public.marketplace_saves FOR SELECT USING (true);

CREATE POLICY "Users can save items"
  ON public.marketplace_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave items"
  ON public.marketplace_saves FOR DELETE
  USING (auth.uid() = user_id);

-- 5. RPC for view increment (SECURITY DEFINER bypasses RLS so any viewer can increment)
CREATE OR REPLACE FUNCTION public.increment_marketplace_views(item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.marketplace_items SET views = views + 1 WHERE id = item_id;
$$;

-- 6. Sample listing — seller_id must be an existing profile ID
--    Using the account that created the existing posts (c66d8cce-...)
INSERT INTO public.marketplace_items
  (title, category, price, condition, description, image_url, seller_id, contact)
VALUES (
  'Calculus: Early Transcendentals (8th Ed.)',
  'Textbooks',
  35.00,
  'Good',
  'Used for one semester. Some highlighting in chapters 1–4, otherwise clean. Includes the unused access code card. Perfect for MATH 101/201.',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
  'c66d8cce-a59c-434a-a594-a254e4d8405f',
  'DM on app or email mia@school.edu'
);
