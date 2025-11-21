-- Create epigrams table for storing short thoughts
CREATE TABLE public.epigrams (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  thread_id TEXT NOT NULL DEFAULT 'default',
  text TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.epigrams ENABLE ROW LEVEL SECURITY;

-- Public can read all epigrams
CREATE POLICY "Anyone can read epigrams"
  ON public.epigrams
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete
-- (We'll validate write_key in edge function)
CREATE POLICY "Authenticated users can insert epigrams"
  ON public.epigrams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update epigrams"
  ON public.epigrams
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete epigrams"
  ON public.epigrams
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_epigrams_created_at ON public.epigrams(created_at);
CREATE INDEX idx_epigrams_thread_id ON public.epigrams(thread_id);