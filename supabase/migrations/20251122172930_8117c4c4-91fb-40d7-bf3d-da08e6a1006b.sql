-- Add optional title column to epigrams table
ALTER TABLE public.epigrams 
ADD COLUMN title text;