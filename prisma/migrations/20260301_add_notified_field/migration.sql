-- AlterTable: Add notified field to event_staff
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "notified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);
