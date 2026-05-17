import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { EditableApplicationInput, ParsedApplicationRow, ReportFilters } from "@/types/domain";

function whereFromFilters(filters: ReportFilters, tenantId = "default"): Prisma.ApplicationWhereInput {
  return {
    tenantId,
    isArchived: false,
    month: filters.month,
    bank: filters.bank,
    dseName: filters.dseName,
    cardType: filters.cardType,
    userName: filters.userName
  };
}

export class ApplicationRepository {
  findExistingApplicationNos(applicationNos: string[]) {
    return prisma.application.findMany({
      where: { applicationNo: { in: applicationNos }, isArchived: false },
      select: { applicationNo: true }
    });
  }

  createMany(uploadId: string, rows: ParsedApplicationRow[], tenantId = "default") {
    return prisma.application.createMany({
      data: rows.map((row) => ({
        uploadId,
        tenantId,
        month: row.month,
        dsa: row.dsa,
        applicationNo: row.applicationNo,
        customerName: row.customerName,
        cardType: row.cardType,
        bank: row.bank,
        userName: row.userName,
        dseName: row.dseName,
        payout96: new Prisma.Decimal(row.payout96),
        given: new Prisma.Decimal(row.given),
        difference: new Prisma.Decimal(row.difference),
        rawData: row.rawData as Prisma.InputJsonValue
      })),
      skipDuplicates: true
    });
  }

  findForReports(filters: ReportFilters, tenantId = "default") {
    return prisma.application.findMany({
      where: whereFromFilters(filters, tenantId),
      orderBy: [{ month: "desc" }, { createdAt: "desc" }]
    });
  }

  findMonthActive(month: string, tenantId = "default") {
    return prisma.application.findMany({
      where: { tenantId, month, isArchived: false },
      orderBy: { createdAt: "asc" }
    });
  }

  archiveMonth(month: string, actorId: string, reason: string, tenantId = "default") {
    return prisma.application.updateMany({
      where: { tenantId, month, isArchived: false },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: actorId,
        archiveReason: reason
      }
    });
  }

  async updateApplication(id: string, input: EditableApplicationInput, actorId?: string, tenantId = "default") {
    const existing = await prisma.application.findFirstOrThrow({
      where: { id, tenantId, isArchived: false }
    });
    const payout96 = input.payout96 ?? Number(existing.payout96);
    const given = input.given ?? Number(existing.given);
    const difference = Math.round((payout96 - given + Number.EPSILON) * 100) / 100;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        dsa: input.dsa,
        applicationNo: input.applicationNo,
        customerName: input.customerName,
        cardType: input.cardType,
        bank: input.bank,
        userName: input.userName,
        dseName: input.dseName,
        payout96: input.payout96 === undefined ? undefined : new Prisma.Decimal(input.payout96),
        given: input.given === undefined ? undefined : new Prisma.Decimal(input.given),
        difference: new Prisma.Decimal(difference),
        versions: {
          create: {
            tenantId,
            changedById: actorId,
            action: "application.updated",
            oldValue: toJson(existing),
            newValue: toJson(input)
          }
        }
      }
    });

    return { existing, updated };
  }

  aggregateDashboard(tenantId = "default") {
    return prisma.application.aggregate({
      where: { tenantId, isArchived: false },
      _count: { id: true },
      _sum: { payout96: true, given: true, difference: true }
    });
  }
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
