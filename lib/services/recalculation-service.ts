import { prisma } from "@/lib/prisma";

export class RecalculationService {
  async refreshMonth(month: string, tenantId = "default") {
    const [activeCount, uploads] = await Promise.all([
      prisma.application.count({ where: { tenantId, month, isArchived: false } }),
      prisma.upload.findMany({
        where: { tenantId, month },
        orderBy: { version: "desc" },
        take: 1
      })
    ]);

    await prisma.monthPeriod.upsert({
      where: { tenantId_month: { tenantId, month } },
      update: {
        uploadedRecords: activeCount,
        activeVersion: uploads[0]?.version ?? 0,
        lastUploadAt: uploads[0]?.importedAt ?? uploads[0]?.createdAt,
        status: activeCount > 0 ? "COMPLETED" : "PENDING"
      },
      create: {
        tenantId,
        month,
        uploadedRecords: activeCount,
        activeVersion: uploads[0]?.version ?? 0,
        lastUploadAt: uploads[0]?.importedAt ?? uploads[0]?.createdAt,
        status: activeCount > 0 ? "COMPLETED" : "PENDING"
      }
    });
  }
}
