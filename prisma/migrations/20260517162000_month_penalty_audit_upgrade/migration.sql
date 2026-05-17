-- Enums
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'DETAIL';

DO $$ BEGIN
  CREATE TYPE "MonthStatus" AS ENUM ('PENDING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'LOCKED', 'PARTIAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UploadMode" AS ENUM ('NEW', 'REPLACE', 'MERGE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Upload versioning
ALTER TABLE "Upload" ADD COLUMN IF NOT EXISTS "mode" "UploadMode" NOT NULL DEFAULT 'NEW';
ALTER TABLE "Upload" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tenantId", "month" ORDER BY "createdAt", "id") AS rn
  FROM "Upload"
)
UPDATE "Upload"
SET "version" = ranked.rn
FROM ranked
WHERE "Upload"."id" = ranked."id";

-- Month periods
CREATE TABLE IF NOT EXISTS "MonthPeriod" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'default',
  "month" TEXT NOT NULL,
  "status" "MonthStatus" NOT NULL DEFAULT 'PENDING',
  "expectedRecords" INTEGER,
  "uploadedRecords" INTEGER NOT NULL DEFAULT 0,
  "activeVersion" INTEGER NOT NULL DEFAULT 0,
  "lastUploadAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MonthPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthPeriod_tenantId_month_key" ON "MonthPeriod"("tenantId", "month");
CREATE INDEX IF NOT EXISTS "MonthPeriod_tenantId_status_idx" ON "MonthPeriod"("tenantId", "status");

INSERT INTO "MonthPeriod" ("id", "tenantId", "month", "status", "uploadedRecords", "activeVersion", "lastUploadAt", "createdAt", "updatedAt")
SELECT
  concat('month_', md5("tenantId" || ':' || "month")),
  "tenantId",
  "month",
  'COMPLETED'::"MonthStatus",
  COUNT(*),
  COALESCE(MAX("version"), 0),
  MAX(COALESCE("importedAt", "createdAt")),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Upload"
GROUP BY "tenantId", "month"
ON CONFLICT ("tenantId", "month") DO UPDATE SET
  "uploadedRecords" = EXCLUDED."uploadedRecords",
  "activeVersion" = EXCLUDED."activeVersion",
  "lastUploadAt" = EXCLUDED."lastUploadAt",
  "updatedAt" = CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Upload_tenantId_month_version_key" ON "Upload"("tenantId", "month", "version");

DO $$ BEGIN
  ALTER TABLE "Upload" ADD CONSTRAINT "Upload_tenantId_month_fkey" FOREIGN KEY ("tenantId", "month") REFERENCES "MonthPeriod"("tenantId", "month") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Soft archive applications
DROP INDEX IF EXISTS "Application_applicationNo_key";
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "archivedBy" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "archiveReason" TEXT;
CREATE INDEX IF NOT EXISTS "Application_tenantId_month_isArchived_idx" ON "Application"("tenantId", "month", "isArchived");
CREATE INDEX IF NOT EXISTS "Application_tenantId_applicationNo_isArchived_idx" ON "Application"("tenantId", "applicationNo", "isArchived");

-- Row version history
CREATE TABLE IF NOT EXISTS "ApplicationVersion" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'default',
  "changedById" TEXT,
  "action" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApplicationVersion_tenantId_applicationId_createdAt_idx" ON "ApplicationVersion"("tenantId", "applicationId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ApplicationVersion" ADD CONSTRAINT "ApplicationVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ApplicationVersion" ADD CONSTRAINT "ApplicationVersion_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Penalties
CREATE TABLE IF NOT EXISTS "Penalty" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'default',
  "month" TEXT NOT NULL,
  "dseName" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Penalty_tenantId_month_dseName_isActive_idx" ON "Penalty"("tenantId", "month", "dseName", "isActive");

DO $$ BEGIN
  ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_tenantId_month_fkey" FOREIGN KEY ("tenantId", "month") REFERENCES "MonthPeriod"("tenantId", "month") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Rich audit values
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "oldValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "newValue" JSONB;
