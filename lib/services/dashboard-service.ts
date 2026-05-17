import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";

const applicationRepository = new ApplicationRepository();

export class DashboardService {
  async getDashboard(tenantId = "default") {
    const aggregate = await applicationRepository.aggregateDashboard(tenantId);
    const applications = await prisma.application.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    const monthly = group(applications, "month");
    const banks = group(applications, "bank");
    const dses = group(applications, "dseName");

    return {
      kpis: {
        totalApplications: aggregate._count.id,
        totalPayout: Number(aggregate._sum.payout96 ?? 0),
        totalGiven: Number(aggregate._sum.given ?? 0),
        totalProfit: Number(aggregate._sum.difference ?? 0)
      },
      monthlyTrends: monthly,
      bankPerformance: banks,
      dsePerformance: dses,
      recentApplications: applications.slice(0, 10)
    };
  }
}

function group<T extends { payout96: unknown; given: unknown; difference: unknown }>(
  rows: Array<T & Record<string, unknown>>,
  key: string
) {
  const grouped = new Map<string, { label: string; applications: number; payout: number; given: number; profit: number }>();

  rows.forEach((row) => {
    const label = String(row[key] ?? "Unassigned");
    const item = grouped.get(label) ?? { label, applications: 0, payout: 0, given: 0, profit: 0 };
    item.applications += 1;
    item.payout += Number(row.payout96);
    item.given += Number(row.given);
    item.profit += Number(row.difference);
    grouped.set(label, item);
  });

  return Array.from(grouped.values()).sort((a, b) => b.profit - a.profit);
}
