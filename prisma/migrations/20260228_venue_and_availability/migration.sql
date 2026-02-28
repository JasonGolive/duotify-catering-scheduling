-- Rename Skill enum value from DECK to BOTH
ALTER TYPE "Skill" RENAME VALUE 'DECK' TO 'BOTH';

-- AlterTable: Add new columns to venues
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "contactName" VARCHAR(100);
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "contactPhone" VARCHAR(20);
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "equipment" TEXT;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Rename notes column if needed (it already exists)
-- ALTER TABLE "venues" RENAME COLUMN "notes" TO "notes";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "venues_isActive_idx" ON "venues"("isActive");

-- CreateTable
CREATE TABLE "staff_availability" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "reason" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_availability_staffId_idx" ON "staff_availability"("staffId");

-- CreateIndex
CREATE INDEX "staff_availability_date_idx" ON "staff_availability"("date");

-- CreateIndex: Unique constraint for staff + date combination
CREATE UNIQUE INDEX "staff_availability_staffId_date_key" ON "staff_availability"("staffId", "date");

-- AddForeignKey
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
