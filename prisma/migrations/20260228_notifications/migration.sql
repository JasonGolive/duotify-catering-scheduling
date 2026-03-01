-- AlterTable: Add notification fields to staff
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "email" VARCHAR(200);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "lineUserId" VARCHAR(50);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "lineNotify" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emailNotify" BOOLEAN NOT NULL DEFAULT true;

-- Drop old column if exists
ALTER TABLE "staff" DROP COLUMN IF EXISTS "lineNotifyToken";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_lineUserId_idx" ON "staff"("lineUserId");

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('ASSIGNMENT', 'REMINDER', 'EVENT_CHANGE', 'EVENT_CANCEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationChannel" AS ENUM ('LINE', 'EMAIL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_staffId_idx" ON "notifications"("staffId");
CREATE INDEX IF NOT EXISTS "notifications_eventId_idx" ON "notifications"("eventId");
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications"("status");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
