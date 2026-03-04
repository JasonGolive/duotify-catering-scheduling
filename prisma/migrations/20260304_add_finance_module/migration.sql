-- CreateEnum for finance module
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH');
CREATE TYPE "SupplierCategory" AS ENUM ('INGREDIENT', 'EQUIPMENT', 'SERVICE', 'OTHER');
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'OTHER');
CREATE TYPE "PaymentInCategory" AS ENUM ('DEPOSIT', 'FINAL_PAYMENT', 'ADDITIONAL', 'REFUND');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "PaymentOutCategory" AS ENUM ('SALARY', 'INGREDIENT', 'RENT', 'UTILITIES', 'EQUIPMENT', 'OTHER');
CREATE TYPE "PayeeType" AS ENUM ('STAFF', 'SUPPLIER', 'VENDOR', 'OTHER');
CREATE TYPE "PaymentOutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable: BankAccount
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "accountName" VARCHAR(100) NOT NULL,
    "bankName" VARCHAR(100),
    "accountNumber" VARCHAR(50),
    "accountType" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TWD',
    "initialBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Supplier
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supplierCode" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "category" "SupplierCategory" NOT NULL,
    "contactPerson" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "taxId" VARCHAR(20),
    "paymentTerms" VARCHAR(100),
    "notes" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentIn
CREATE TABLE "payments_in" (
    "id" TEXT NOT NULL,
    "paymentNumber" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20),
    "eventId" TEXT,
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethodType" NOT NULL,
    "bankAccountId" TEXT,
    "checkNumber" VARCHAR(50),
    "transactionReference" VARCHAR(100),
    "paymentCategory" "PaymentInCategory" NOT NULL,
    "receiptNumber" VARCHAR(50),
    "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentOut
CREATE TABLE "payments_out" (
    "id" TEXT NOT NULL,
    "paymentNumber" VARCHAR(50) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethodType" NOT NULL,
    "bankAccountId" TEXT,
    "checkNumber" VARCHAR(50),
    "transactionReference" VARCHAR(100),
    "paymentCategory" "PaymentOutCategory" NOT NULL,
    "payeeType" "PayeeType" NOT NULL,
    "staffId" TEXT,
    "supplierId" TEXT,
    "payeeName" VARCHAR(100),
    "invoiceNumber" VARCHAR(50),
    "status" "PaymentOutStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_out_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_status_idx" ON "bank_accounts"("status");

CREATE UNIQUE INDEX "suppliers_supplierCode_key" ON "suppliers"("supplierCode");
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");
CREATE INDEX "suppliers_category_idx" ON "suppliers"("category");

CREATE UNIQUE INDEX "payments_in_paymentNumber_key" ON "payments_in"("paymentNumber");
CREATE INDEX "payments_in_paymentDate_idx" ON "payments_in"("paymentDate");
CREATE INDEX "payments_in_eventId_idx" ON "payments_in"("eventId");
CREATE INDEX "payments_in_status_idx" ON "payments_in"("status");
CREATE INDEX "payments_in_paymentCategory_idx" ON "payments_in"("paymentCategory");

CREATE UNIQUE INDEX "payments_out_paymentNumber_key" ON "payments_out"("paymentNumber");
CREATE INDEX "payments_out_paymentDate_idx" ON "payments_out"("paymentDate");
CREATE INDEX "payments_out_paymentCategory_idx" ON "payments_out"("paymentCategory");
CREATE INDEX "payments_out_status_idx" ON "payments_out"("status");
CREATE INDEX "payments_out_staffId_idx" ON "payments_out"("staffId");
CREATE INDEX "payments_out_supplierId_idx" ON "payments_out"("supplierId");

-- AddForeignKey
ALTER TABLE "payments_in" ADD CONSTRAINT "payments_in_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments_in" ADD CONSTRAINT "payments_in_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments_out" ADD CONSTRAINT "payments_out_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments_out" ADD CONSTRAINT "payments_out_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments_out" ADD CONSTRAINT "payments_out_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
