-- AlterTable: Add staff event detail fields
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "mealTime" VARCHAR(5);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "menu" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminders" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "staffToken" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "events_staffToken_key" ON "events"("staffToken");
