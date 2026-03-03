-- AlterTable
ALTER TABLE "event_staff" ADD COLUMN "checkInTime" TIMESTAMP(3);
ALTER TABLE "event_staff" ADD COLUMN "checkInLatitude" DOUBLE PRECISION;
ALTER TABLE "event_staff" ADD COLUMN "checkInLongitude" DOUBLE PRECISION;
ALTER TABLE "event_staff" ADD COLUMN "checkInPhotoUrl" TEXT;
ALTER TABLE "event_staff" ADD COLUMN "checkOutTime" TIMESTAMP(3);
ALTER TABLE "event_staff" ADD COLUMN "checkOutLatitude" DOUBLE PRECISION;
ALTER TABLE "event_staff" ADD COLUMN "checkOutLongitude" DOUBLE PRECISION;

-- Modify actualHours precision from DECIMAL(4,1) to DECIMAL(4,2)
ALTER TABLE "event_staff" ALTER COLUMN "actualHours" TYPE DECIMAL(4,2);
