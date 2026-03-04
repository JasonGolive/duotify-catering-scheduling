-- Add notes field to AvailabilityToken for staff remarks
-- Using IF NOT EXISTS to make it safe to run multiple times
ALTER TABLE "AvailabilityToken" ADD COLUMN IF NOT EXISTS "notes" VARCHAR(600);
