-- CreateTable: SalaryRule
CREATE TABLE "salary_rules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "condition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_rules_isActive_idx" ON "salary_rules"("isActive");
CREATE INDEX "salary_rules_priority_idx" ON "salary_rules"("priority");

-- AlterTable: WorkLog - add bonusBreakdown and deductions
ALTER TABLE "work_logs" ADD COLUMN "bonusBreakdown" JSONB;
ALTER TABLE "work_logs" ADD COLUMN "deductions" DECIMAL(10,0) NOT NULL DEFAULT 0;
