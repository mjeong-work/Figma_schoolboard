-- =============================================================
-- Fix: RLS violation on profiles INSERT during signup
--
-- Root cause: frontend INSERT runs before a session exists
-- (when email confirmation is enabled auth.uid() is null at
-- insert time, so any WITH CHECK (auth.uid() = id) fails).
--
-- Fix: create a SECURITY DEFINER trigger that auto-inserts the
-- profile row when auth.users gets a new row.  The frontend
-- passes the extra fields via signUp options.data; we read them
-- from raw_user_meta_data.  The frontend INSERT is removed.
-- =============================================================

-- 1. Trigger function ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    department,
    graduation_year,
    status,
    verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    NEW.raw_user_meta_data->>'graduation_year',   -- nullable, fine
    'pending',
    false
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent; safe if called twice
  RETURN NEW;
END;
$$;

-- 2. Trigger on auth.users -----------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS policies for profiles table ------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies so we start clean
DROP POLICY IF EXISTS "Users can view own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"  ON public.profiles;

-- Users can always read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- No frontend INSERT policy needed — the trigger handles it.
-- Keeping a narrow INSERT policy as a fallback (works when
-- email confirmation is disabled and a session exists immediately).
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (for the approval dashboard)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'Administrator'
    )
  );

-- Admins can update any profile (approve / reject)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'Administrator'
    )
  );
