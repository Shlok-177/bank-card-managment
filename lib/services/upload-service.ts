import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import { ConfigRepository } from "@/lib/repositories/config-repository";
import { AuditService } from "@/lib/services/audit-service";
import { ExcelParserService } from "@/lib/services/excel-parser-service";
import { RecalculationService } from "@/lib/services/recalculation-service";
import type { ColumnMappingDefinition, UploadImportMode } from "@/types/domain";

const configRepository = new ConfigRepository();
const applicationRepository = new ApplicationRepository();
const parser = new ExcelParserService();
const auditService = new AuditService();
const recalculationService = new RecalculationService();

export class UploadService {
  async validateFile(buffer: Buffer, tenantId = "default", options?: { month?: string; mode?: UploadImportMode }) {
    const mappings = (await configRepository.getColumnMappings(tenantId)) as ColumnMappingDefinition[];
    const validation = await parser.parse(buffer, mappings);
    const month = options?.month || validation.validRows[0]?.month;
    const mode = options?.mode ?? "NEW";
    if (month) {
      validation.validRows = validation.validRows.map((row) => ({ ...row, month }));
    }
    const activeMonthRows = month
      ? await prisma.application.findMany({
          where: { tenantId, month, isArchived: false },
          select: { applicationNo: true }
        })
      : [];
    const activeMonthSet = new Set(activeMonthRows.map((row) => row.applicationNo));

    if (month && activeMonthRows.length) {
      const latestUpload = await prisma.upload.findFirst({
        where: { tenantId, month },
        orderBy: { version: "desc" },
        select: { version: true }
      });
      validation.existingMonth = {
        month,
        activeRecords: activeMonthRows.length,
        nextVersion: (latestUpload?.version ?? 0) + 1
      };
    }

    const existing = await applicationRepository.findExistingApplicationNos(
      validation.validRows.map((row) => row.applicationNo)
    );
    const existingSet = new Set(
      existing
        .map((row) => row.applicationNo)
        .filter((applicationNo) => {
          if (activeMonthSet.has(applicationNo)) return false;
          return true;
        })
    );

    if (existingSet.size) {
      validation.errors.push(
        ...Array.from(existingSet).map((applicationNo) => ({
          rowNumber: 0,
          field: "applicationNo",
          message: `Application number already exists: ${applicationNo}`
        }))
      );
      validation.duplicateApplicationNos.push(...Array.from(existingSet));
      validation.validRows = validation.validRows.filter((row) => !existingSet.has(row.applicationNo));
    }

    if (mode === "MERGE" && activeMonthSet.size) {
      validation.validRows = validation.validRows.filter((row) => !activeMonthSet.has(row.applicationNo));
    }

    return validation;
  }

  async importFile(input: {
    fileName: string;
    fileSize: number;
    buffer: Buffer;
    month: string;
    uploadedById?: string;
    tenantId?: string;
    mode?: UploadImportMode;
  }) {
    const tenantId = input.tenantId ?? "default";
    const requestedMode = input.mode ?? "NEW";
    const firstValidation = await this.validateFile(input.buffer, tenantId, { month: input.month, mode: requestedMode });
    const mode: UploadImportMode = requestedMode === "NEW" && firstValidation.existingMonth ? "REPLACE" : requestedMode;
    const validation =
      mode === requestedMode
        ? firstValidation
        : await this.validateFile(input.buffer, tenantId, { month: input.month, mode });

    if (validation.errors.length) {
      return { imported: false, validation };
    }

    const uploadedById = await this.resolveUploaderId(input.uploadedById);
    const version = await this.nextVersion(input.month, tenantId);

    await prisma.monthPeriod.upsert({
      where: { tenantId_month: { tenantId, month: input.month } },
      update: { status: "PROCESSING" },
      create: { tenantId, month: input.month, status: "PROCESSING" }
    });

    if (mode === "REPLACE") {
      const archived = await applicationRepository.archiveMonth(input.month, uploadedById, `replace-version-${version}`, tenantId);
      await auditService.log({
        tenantId,
        actorId: uploadedById,
        action: "month.replaced.archive",
        entity: "month",
        entityId: input.month,
        metadata: { archived: archived.count, version }
      });
    }

    const upload = await prisma.upload.create({
      data: {
        fileName: input.fileName,
        fileSize: input.fileSize,
        month: input.month,
        status: "IMPORTED",
        mode,
        version,
        totalRows: validation.totalRows,
        validRows: validation.validRows.length,
        invalidRows: 0,
        mapping: validation.mapping,
        uploadedById,
        tenantId,
        importedAt: new Date()
      }
    });

    await applicationRepository.createMany(upload.id, validation.validRows, tenantId);
    await recalculationService.refreshMonth(input.month, tenantId);

    await auditService.log({
      actorId: uploadedById,
      action: mode === "REPLACE" ? "upload.replaced" : mode === "MERGE" ? "upload.merged" : "upload.imported",
      entity: "upload",
      entityId: upload.id,
      tenantId,
      metadata: { fileName: input.fileName, rows: validation.validRows.length, month: input.month, version, mode }
    });

    return { imported: true, upload, validation };
  }

  private async nextVersion(month: string, tenantId: string) {
    const latest = await prisma.upload.findFirst({
      where: { tenantId, month },
      orderBy: { version: "desc" },
      select: { version: true }
    });
    return (latest?.version ?? 0) + 1;
  }

  private async resolveUploaderId(uploadedById?: string) {
    if (uploadedById) {
      const user = await prisma.user.findUnique({
        where: { id: uploadedById },
        select: { id: true }
      });
      if (user) return user.id;
    }

    return this.getFallbackUserId();
  }

  private async getFallbackUserId() {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (user) return user.id;

    const created = await prisma.user.upsert({
      where: { email: "system@bankpayout.local" },
      update: {},
      create: {
        email: "system@bankpayout.local",
        name: "System",
        passwordHash: "disabled",
        role: "SUPER_ADMIN"
      }
    });
    return created.id;
  }
}
