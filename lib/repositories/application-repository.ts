import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ParsedApplicationRow, ReportFilters } from "@/types/domain";

function whereFromFilters(filters: ReportFilters, tenantId = "default"): Prisma.ApplicationWhereInput {
  return {
    tenantId,
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
      where: { applicationNo: { in: applicationNos } },
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

  aggregateDashboard(tenantId = "default") {
    return prisma.application.aggregate({
      where: { tenantId },
      _count: { id: true },
      _sum: { payout96: true, given: true, difference: true }
    });
  }
}
