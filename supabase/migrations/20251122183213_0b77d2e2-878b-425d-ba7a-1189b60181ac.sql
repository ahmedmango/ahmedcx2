-- Add display_order column to epigrams table
ALTER TABLE public.epigrams 
ADD COLUMN display_order integer;

-- Set initial display_order based on current order (by id)
UPDATE public.epigrams 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
  FROM public.epigrams
) subquery
WHERE epigrams.id = subquery.id;

-- Make display_order NOT NULL after setting initial values
ALTER TABLE public.epigrams 
ALTER COLUMN display_order SET NOT NULL;

-- Add unique constraint to prevent duplicate positions
ALTER TABLE public.epigrams 
ADD CONSTRAINT epigrams_display_order_unique UNIQUE (display_order);

-- Create index for better query performance
CREATE INDEX idx_epigrams_display_order ON public.epigrams(display_order);