-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_out_attachments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_out_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_out_attachments_paymentId_idx" ON "payment_out_attachments"("paymentId");

-- AddForeignKey
ALTER TABLE "payment_out_attachments" ADD CONSTRAINT "payment_out_attachments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments_out"("id") ON DELETE CASCADE ON UPDATE CASCADE;
