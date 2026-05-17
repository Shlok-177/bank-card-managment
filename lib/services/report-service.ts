import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import type { ReportFilters, ReportRow } from "@/types/domain";

const applicationRepository = new ApplicationRepository();

type GroupBy = "bank" | "dseName" | "userName" | "month" | "cardType";

export class ReportService {
  async generate(type: "bank" | "dse" | "user" | "monthly" | "profit", filters: ReportFilters, tenantId = "default") {
    const rows = await applicationRepository.findForReports(filters, tenantId);
    const groupKey: GroupBy =
      type === "bank" ? "bank" : type === "dse" ? "dseName" : type === "user" ? "userName" : "month";
    const grouped = new Map<string, ReportRow>();

    for (const row of rows) {
      const label = String(row[groupKey] ?? "Unassigned");
      const existing =
        grouped.get(label) ??
        ({
          label,
          totalApplications: 0,
          totalPayout: 0,
          totalGiven: 0,
          totalProfit: 0
        } satisfies ReportRow);

      existing.totalApplications += 1;
      existing.totalPayout += Number(row.payout96);
      existing.totalGiven += Number(row.given);
      existing.totalProfit += Number(row.difference);
      grouped.set(label, existing);
    }

    const data = Array.from(grouped.values()).sort((a, b) => b.totalProfit - a.totalProfit);

    await prisma.report.create({
      data: {
        tenantId,
        type: type === "bank" ? "BANK_WISE" : type === "dse" ? "DSE_WISE" : type === "user" ? "USER_WISE" : type === "profit" ? "PROFIT" : "MONTHLY_SUMMARY",
        title: `${type} report`,
        filters,
        data
      }
    });

    return { data, raw: rows };
  }
}
