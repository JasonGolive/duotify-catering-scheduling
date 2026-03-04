-- Add notes field to AvailabilityToken for staff remarks
ALTER TABLE "AvailabilityToken" ADD COLUMN "notes" VARCHAR(600);
