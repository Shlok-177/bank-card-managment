import { prisma } from "@/lib/prisma";
import type { UploadValidationResult } from "@/types/domain";

export class UploadRepository {
  createValidatedUpload(input: {
    fileName: string;
    fileSize: number;
    month: string;
    uploadedById: string;
    tenantId?: string;
    validation: UploadValidationResult;
  }) {
    return prisma.upload.create({
      data: {
        fileName: input.fileName,
        fileSize: input.fileSize,
        month: input.month,
        status: "VALIDATED",
        totalRows: input.validation.totalRows,
        validRows: input.validation.validRows.length,
        invalidRows: input.validation.errors.length,
        mapping: input.validation.mapping,
        errors: input.validation.errors,
        uploadedById: input.uploadedById,
        tenantId: input.tenantId ?? "default"
      }
    });
  }

  markImported(uploadId: string) {
    return prisma.upload.update({
      where: { id: uploadId },
      data: { status: "IMPORTED", importedAt: new Date() }
    });
  }
}
