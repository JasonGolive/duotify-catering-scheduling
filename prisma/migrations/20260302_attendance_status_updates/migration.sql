-- Add new values to AttendanceStatus enum
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE_REQUESTED';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE_APPROVED';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE_REJECTED';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Add new value to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAVE_REQUEST';

-- Add new columns to event_staff table
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "leaveReason" VARCHAR(500);
