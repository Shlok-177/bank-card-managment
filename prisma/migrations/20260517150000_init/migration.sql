-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('VALIDATING', 'VALIDATED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BANK_WISE', 'DSE_WISE', 'USER_WISE', 'MONTHLY_SUMMARY', 'PROFIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'VALIDATING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "mapping" JSONB NOT NULL,
    "errors" JSONB,
    "uploadedById" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt" TIMESTAMP(3),

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "month" TEXT NOT NULL,
    "dsa" TEXT,
    "applicationNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "cardType" TEXT,
    "bank" TEXT NOT NULL,
    "userName" TEXT,
    "dseName" TEXT,
    "payout96" DECIMAL(14,2) NOT NULL,
    "given" DECIMAL(14,2) NOT NULL,
    "difference" DECIMAL(14,2) NOT NULL,
    "bankFormula" JSONB,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "bank" TEXT NOT NULL,
    "cardType" TEXT,
    "formula" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "internalField" TEXT NOT NULL,
    "aliases" TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE INDEX "Upload_tenantId_month_status_idx" ON "Upload"("tenantId", "month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNo_key" ON "Application"("applicationNo");

-- CreateIndex
CREATE INDEX "Application_tenantId_month_idx" ON "Application"("tenantId", "month");

-- CreateIndex
CREATE INDEX "Application_tenantId_bank_idx" ON "Application"("tenantId", "bank");

-- CreateIndex
CREATE INDEX "Application_tenantId_dseName_idx" ON "Application"("tenantId", "dseName");

-- CreateIndex
CREATE INDEX "Application_tenantId_userName_idx" ON "Application"("tenantId", "userName");

-- CreateIndex
CREATE INDEX "BankRule_tenantId_bank_cardType_isActive_idx" ON "BankRule"("tenantId", "bank", "cardType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnMapping_tenantId_internalField_key" ON "ColumnMapping"("tenantId", "internalField");

-- CreateIndex
CREATE INDEX "Report_tenantId_type_createdAt_idx" ON "Report"("tenantId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_createdAt_idx" ON "AuditLog"("tenantId", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

