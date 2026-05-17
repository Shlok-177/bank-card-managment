import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import { ConfigRepository } from "@/lib/repositories/config-repository";
import { ExcelParserService } from "@/lib/services/excel-parser-service";
import type { ColumnMappingDefinition } from "@/types/domain";

const configRepository = new ConfigRepository();
const applicationRepository = new ApplicationRepository();
const parser = new ExcelParserService();

export class UploadService {
  async validateFile(buffer: Buffer, tenantId = "default") {
    const mappings = (await configRepository.getColumnMappings(tenantId)) as ColumnMappingDefinition[];
    const validation = await parser.parse(buffer, mappings);
    const existing = await applicationRepository.findExistingApplicationNos(
      validation.validRows.map((row) => row.applicationNo)
    );
    const existingSet = new Set(existing.map((row) => row.applicationNo));

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

    return validation;
  }

  async importFile(input: {
    fileName: string;
    fileSize: number;
    buffer: Buffer;
    month: string;
    uploadedById?: string;
    tenantId?: string;
  }) {
    const tenantId = input.tenantId ?? "default";
    const validation = await this.validateFile(input.buffer, tenantId);

    if (validation.errors.length) {
      return { imported: false, validation };
    }

    const uploadedById = await this.resolveUploaderId(input.uploadedById);

    const upload = await prisma.upload.create({
      data: {
        fileName: input.fileName,
        fileSize: input.fileSize,
        month: input.month,
        status: "IMPORTED",
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

    await prisma.auditLog.create({
      data: {
        actorId: uploadedById,
        action: "upload.imported",
        entity: "upload",
        entityId: upload.id,
        tenantId,
        metadata: { fileName: input.fileName, rows: validation.validRows.length }
      }
    });

    return { imported: true, upload, validation };
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
