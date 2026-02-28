-- AlterTable: Add assemblyTime to events
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "assemblyTime" VARCHAR(5);

-- CreateEnum
CREATE TYPE "WorkLogSource" AS ENUM ('IMPORT', 'MANUAL', 'SYSTEM');

-- CreateTable
CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "hours" DECIMAL(4,1) NOT NULL,
    "eventId" TEXT,
    "hourlyRate" DECIMAL(10,0),
    "salary" DECIMAL(10,0) NOT NULL,
    "source" "WorkLogSource" NOT NULL DEFAULT 'IMPORT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_logs_staffId_idx" ON "work_logs"("staffId");

-- CreateIndex
CREATE INDEX "work_logs_date_idx" ON "work_logs"("date");

-- CreateIndex
CREATE INDEX "work_logs_eventId_idx" ON "work_logs"("eventId");

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
