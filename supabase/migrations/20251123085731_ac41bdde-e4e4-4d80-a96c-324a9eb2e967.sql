-- Rename page_views to scroll_tracking and modify structure
ALTER TABLE public.page_views RENAME TO scroll_tracking;

-- Add new columns for scroll tracking
ALTER TABLE public.scroll_tracking
ADD COLUMN max_thread_reached integer,
ADD COLUMN scroll_depth_percentage integer,
ADD COLUMN session_duration_seconds integer;

-- Create index for better query performance
CREATE INDEX idx_scroll_tracking_max_thread ON public.scroll_tracking(max_thread_reached DESC);
CREATE INDEX idx_scroll_tracking_created_at ON public.scroll_tracking(created_at DESC);