-- CreateTable
CREATE TABLE "availability_tokens" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_logs" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL,
    "reason" VARCHAR(200),
    "editedBy" VARCHAR(50) NOT NULL,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availability_tokens_token_key" ON "availability_tokens"("token");

-- CreateIndex
CREATE INDEX "availability_tokens_token_idx" ON "availability_tokens"("token");

-- CreateIndex
CREATE INDEX "availability_tokens_staffId_idx" ON "availability_tokens"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_tokens_staffId_month_year_key" ON "availability_tokens"("staffId", "month", "year");

-- CreateIndex
CREATE INDEX "availability_logs_staffId_idx" ON "availability_logs"("staffId");

-- CreateIndex
CREATE INDEX "availability_logs_createdAt_idx" ON "availability_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "availability_tokens" ADD CONSTRAINT "availability_tokens_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_logs" ADD CONSTRAINT "availability_logs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
