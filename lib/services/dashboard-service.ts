import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import { roundMoney } from "@/lib/utils";
import { ReportService } from "@/lib/services/report-service";

const applicationRepository = new ApplicationRepository();
const reportService = new ReportService();

export class DashboardService {
  async getDashboard(tenantId = "default") {
    const aggregate = await applicationRepository.aggregateDashboard(tenantId);
    const applications = await prisma.application.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { createdAt: "desc" }
    });

    const monthlyReport = await reportService.generate("monthly", {}, tenantId);
    const monthly = monthlyReport.data.map((row) => ({
      label: row.label,
      applications: row.totalApplications,
      payout: row.totalPayout,
      given: row.totalGiven,
      profit: row.finalProfit,
      originalProfit: row.totalProfit,
      penalty: row.companyPenaltyAmount
    }));
    const finalProfit = roundMoney(monthly.reduce((sum, row) => sum + row.profit, 0));
    const companyPenalty = roundMoney(monthlyReport.data.reduce((sum, row) => sum + row.companyPenaltyAmount, 0));
    const banks = group(applications, "bank");
    const dses = group(applications, "dseName");

    return {
      kpis: {
        totalApplications: aggregate._count.id,
        totalPayout: roundMoney(Number(aggregate._sum.payout96 ?? 0)),
        totalGiven: roundMoney(Number(aggregate._sum.given ?? 0)),
        totalProfit: finalProfit,
        penaltyAmount: companyPenalty
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
    item.payout = roundMoney(item.payout + Number(row.payout96));
    item.given = roundMoney(item.given + Number(row.given));
    item.profit = roundMoney(item.profit + Number(row.difference));
    grouped.set(label, item);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      payout: roundMoney(item.payout),
      given: roundMoney(item.given),
      profit: roundMoney(item.profit)
    }))
    .sort((a, b) => b.profit - a.profit);
}
