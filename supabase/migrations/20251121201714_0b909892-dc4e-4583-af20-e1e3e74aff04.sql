-- Create settings table for site customization
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default color settings
INSERT INTO public.settings (key, value) VALUES
  ('header_text_color', '0 0% 45%'),
  ('thread_number_color', '5 100% 66%'),
  ('progress_bar_color', '5 100% 66%'),
  ('body_text_color', '0 0% 15%')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Settings are viewable by everyone"
  ON public.settings
  FOR SELECT
  USING (true);

-- Allow update only (for admin functionality)
CREATE POLICY "Settings can be updated by anyone"
  ON public.settings
  FOR UPDATE
  USING (true);