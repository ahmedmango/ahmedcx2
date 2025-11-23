-- Create page_views table for tracking visits
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page views
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read page views (needed for admin panel)
CREATE POLICY "Anyone can read page views"
ON public.page_views
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_page_views_visited_at ON public.page_views(visited_at DESC);