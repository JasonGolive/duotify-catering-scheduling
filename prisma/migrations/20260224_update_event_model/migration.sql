-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH', 'HOTEL_PAID', 'OTHER');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Remove endTime, expectedGuests and add new columns
ALTER TABLE "events" DROP COLUMN IF EXISTS "endTime";
ALTER TABLE "events" DROP COLUMN IF EXISTS "expectedGuests";

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "venueId" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "adultsCount" INTEGER;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "childrenCount" INTEGER;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "vegetarianCount" INTEGER;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,0);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "depositAmount" DECIMAL(10,0);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "depositMethod" "PaymentMethod";
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "depositDate" DATE;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "balanceAmount" DECIMAL(10,0);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "balanceMethod" "PaymentMethod";
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "balanceDate" DATE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_venueId_idx" ON "events"("venueId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
