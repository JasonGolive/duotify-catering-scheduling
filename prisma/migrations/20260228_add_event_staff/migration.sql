-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ATTENDED', 'LATE', 'ABSENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "event_staff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "Skill" NOT NULL,
    "salary" DECIMAL(10,0) NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "actualHours" DECIMAL(4,1),
    "adjustedSalary" DECIMAL(10,0),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_staff_eventId_idx" ON "event_staff"("eventId");

-- CreateIndex
CREATE INDEX "event_staff_staffId_idx" ON "event_staff"("staffId");

-- CreateIndex
CREATE INDEX "event_staff_attendanceStatus_idx" ON "event_staff"("attendanceStatus");

-- CreateIndex: Unique constraint for event + staff combination
CREATE UNIQUE INDEX "event_staff_eventId_staffId_key" ON "event_staff"("eventId", "staffId");

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
