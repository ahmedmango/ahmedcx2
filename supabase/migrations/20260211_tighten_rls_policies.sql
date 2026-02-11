-- Tighten RLS policies for security
-- Settings: only service_role can update (admin goes through edge function)
DROP POLICY IF EXISTS "Settings can be updated by anyone" ON public.settings;
CREATE POLICY "Settings can be updated via service role"
  ON public.settings
  FOR UPDATE
  TO service_role
  USING (true);

-- Also allow anon to update settings (needed for admin panel direct updates)
-- But ideally this should go through an edge function too
-- For now, keep read-only for anon and route writes through edge function
-- DROP POLICY IF EXISTS "Settings can be updated by anyone" ON public.settings;

-- Secret epigrams: restrict write operations to service_role
DROP POLICY IF EXISTS "Secret epigrams can be inserted by anyone" ON public.secret_epigrams;
DROP POLICY IF EXISTS "Secret epigrams can be updated by anyone" ON public.secret_epigrams;
DROP POLICY IF EXISTS "Secret epigrams can be deleted by anyone" ON public.secret_epigrams;

CREATE POLICY "Secret epigrams insert via service role"
  ON public.secret_epigrams
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Secret epigrams update via service role"
  ON public.secret_epigrams
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Secret epigrams delete via service role"
  ON public.secret_epigrams
  FOR DELETE
  TO service_role
  USING (true);

-- Note: The epigrams edge function already uses service_role key.
-- After applying this migration, the Admin.tsx code for secret_epigrams 
-- and settings needs to be routed through the edge function instead of 
-- direct Supabase client calls.
--
-- IMPORTANT: If you need the admin panel to work immediately,
-- you can temporarily keep the permissive policies and migrate
-- the admin code to use the edge function first. Then apply this migration.
