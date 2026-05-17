ALTER TABLE "Penalty" ADD COLUMN IF NOT EXISTS "applicationNo" TEXT;
CREATE INDEX IF NOT EXISTS "Penalty_tenantId_applicationNo_isActive_idx" ON "Penalty"("tenantId", "applicationNo", "isActive");
