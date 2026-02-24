-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('FRONT', 'HOT', 'DECK');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN "skill" "Skill" NOT NULL DEFAULT 'FRONT';

-- CreateIndex
CREATE INDEX "staff_skill_idx" ON "staff"("skill");
