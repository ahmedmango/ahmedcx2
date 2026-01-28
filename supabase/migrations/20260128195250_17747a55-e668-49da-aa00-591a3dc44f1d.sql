-- Create secret_epigrams table (same structure as epigrams)
CREATE TABLE public.secret_epigrams (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secret_epigrams ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Secret epigrams are viewable by everyone" 
ON public.secret_epigrams 
FOR SELECT 
USING (true);

CREATE POLICY "Secret epigrams can be inserted by anyone" 
ON public.secret_epigrams 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Secret epigrams can be updated by anyone" 
ON public.secret_epigrams 
FOR UPDATE 
USING (true);

CREATE POLICY "Secret epigrams can be deleted by anyone" 
ON public.secret_epigrams 
FOR DELETE 
USING (true);

-- Migrate existing secret_thread content if exists
INSERT INTO public.secret_epigrams (text, display_order)
SELECT content, 1 FROM public.secret_thread WHERE content != '' LIMIT 1;