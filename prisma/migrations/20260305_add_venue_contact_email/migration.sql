-- Add contactEmail to venues
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "contactEmail" VARCHAR(100);
