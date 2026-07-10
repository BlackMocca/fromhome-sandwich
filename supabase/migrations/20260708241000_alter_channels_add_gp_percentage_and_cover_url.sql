-- Alter channels table to add gp_percentage and cover_url columns
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS gp_percentage DECIMAL(6,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.channels.gp_percentage IS 'Gross Profit % (สูตร: ต้นทุน = ราคาขาย / (1 + GP%))';
COMMENT ON COLUMN public.channels.cover_url IS 'URL of the channel cover image';
