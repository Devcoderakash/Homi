-- Migration 009: Full Editable & Removable Service Categories
-- Adds starting_price and color columns to public.categories so base visit fees,
-- icons, badge colors, descriptions, names, slugs, and active states can all be edited or deleted.

BEGIN;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS starting_price INTEGER NOT NULL DEFAULT 199,
  ADD COLUMN IF NOT EXISTS color VARCHAR(30) NOT NULL DEFAULT '#e5edee';

UPDATE public.categories SET color = '#dfeefd' WHERE slug = 'plumbing' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#fff0d8' WHERE slug = 'electrical' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#f7e8d8' WHERE slug = 'carpentry' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#e9e4fa' WHERE slug = 'cleaning' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#fce4e4' WHERE slug = 'painting' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#e2f2e8' WHERE slug = 'appliance-repair' AND (color IS NULL OR color = '#e5edee');
UPDATE public.categories SET color = '#f4e9d9' WHERE slug = 'furniture-repair' AND (color IS NULL OR color = '#e5edee');

COMMIT;
