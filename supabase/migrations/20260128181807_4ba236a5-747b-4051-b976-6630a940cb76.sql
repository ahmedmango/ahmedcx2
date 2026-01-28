-- Create table for secret thread content
CREATE TABLE public.secret_thread (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.secret_thread ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Secret thread is viewable by everyone" 
ON public.secret_thread 
FOR SELECT 
USING (true);

-- Anyone can update (admin will verify with WRITE_KEY)
CREATE POLICY "Secret thread can be updated by anyone" 
ON public.secret_thread 
FOR UPDATE 
USING (true);

-- Insert default row
INSERT INTO public.secret_thread (content) VALUES ('You found the hidden layer. These are unfinished thoughts that live beneath the surface.');