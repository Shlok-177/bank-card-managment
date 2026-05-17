import { prisma } from "@/lib/prisma";

export class MonthService {
  async list(tenantId = "default") {
    const months = await prisma.monthPeriod.findMany({
      where: { tenantId },
      include: {
        uploads: { orderBy: { version: "desc" }, take: 3 },
        penalties: { where: { isActive: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return months.map((month) => ({
      ...month,
      penaltyAmount: month.penalties.reduce((sum, penalty) => sum + Number(penalty.amount), 0)
    }));
  }

  async workspace(month: string, tenantId = "default") {
    const [period, applications, uploads, penalties] = await Promise.all([
      prisma.monthPeriod.findUnique({ where: { tenantId_month: { tenantId, month } } }),
      prisma.application.findMany({
        where: { tenantId, month, isArchived: false },
        orderBy: { createdAt: "asc" }
      }),
      prisma.upload.findMany({
        where: { tenantId, month },
        orderBy: { version: "desc" }
      }),
      prisma.penalty.findMany({
        where: { tenantId, month, isActive: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return { period, applications, uploads, penalties };
  }
}
