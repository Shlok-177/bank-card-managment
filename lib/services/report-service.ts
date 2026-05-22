import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import { roundMoney } from "@/lib/utils";
import type { ReportFilters, ReportRow } from "@/types/domain";

const applicationRepository = new ApplicationRepository();

type GroupBy = "bank" | "dseName" | "userName" | "month" | "cardType";

export class ReportService {
  async generate(type: "bank" | "dse" | "user" | "monthly" | "profit", filters: ReportFilters, tenantId = "default") {
    const rows = await applicationRepository.findForReports(filters, tenantId);
    const penalties = await prisma.penalty.findMany({
      where: {
        tenantId,
        isActive: true,
        month: filters.month,
        dseName: filters.dseName
      }
    });
    const groupKey: GroupBy =
      type === "bank" ? "bank" : type === "dse" ? "dseName" : type === "user" ? "userName" : "month";
    const grouped = new Map<string, ReportRow>();
    const appliedPenalties = new Map<string, Set<string>>();
    const penaltyByApplication = new Map<string, { amount: number; reasons: string[] }>();

    for (const penalty of penalties) {
      const key = penalty.applicationNo ?? `${penalty.month}:${penalty.dseName}`;
      const item = penaltyByApplication.get(key) ?? { amount: 0, reasons: [] };
      item.amount = roundMoney(item.amount + Number(penalty.amount));
      item.reasons.push(penalty.reason);
      penaltyByApplication.set(key, item);
    }

    for (const row of rows) {
      const label = String(row[groupKey] ?? "Unassigned");
      const existing =
        grouped.get(label) ??
        ({
          label,
          totalApplications: 0,
          totalPayout: 0,
          totalGiven: 0,
          totalProfit: 0,
          penaltyAmount: 0,
          dsePenaltyAmount: 0,
          companyPenaltyAmount: 0,
          finalGiven: 0,
          finalProfit: 0,
          penaltyReasons: []
        } satisfies ReportRow);

      existing.totalApplications += 1;
      existing.totalPayout = roundMoney(existing.totalPayout + Number(row.payout96));
      existing.totalGiven = roundMoney(existing.totalGiven + Number(row.given));
      existing.totalProfit = roundMoney(existing.totalProfit + Number(row.difference));
      const penaltyKey = row.applicationNo;
      const penalty = penaltyByApplication.get(penaltyKey);
      const appliedForGroup = appliedPenalties.get(label) ?? new Set<string>();
      if (penalty && !appliedForGroup.has(penaltyKey)) {
        const given = Number(row.given);
        const dseDeduction = roundMoney(Math.min(penalty.amount, given));
        const companyDeduction = roundMoney(Math.max(penalty.amount - given, 0));
        existing.penaltyAmount = roundMoney(existing.penaltyAmount + penalty.amount);
        existing.dsePenaltyAmount = roundMoney(existing.dsePenaltyAmount + dseDeduction);
        existing.companyPenaltyAmount = roundMoney(existing.companyPenaltyAmount + companyDeduction);
        existing.penaltyReasons = Array.from(new Set([...(existing.penaltyReasons ?? []), ...penalty.reasons]));
        appliedForGroup.add(penaltyKey);
        appliedPenalties.set(label, appliedForGroup);
      }
      grouped.set(label, existing);
    }

    for (const item of grouped.values()) {
      item.finalGiven = roundMoney(item.totalGiven - item.dsePenaltyAmount);
      item.finalProfit = roundMoney(item.totalProfit - item.companyPenaltyAmount);
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

  async detail(filters: ReportFilters, tenantId = "default") {
    const [rows, penalties] = await Promise.all([
      applicationRepository.findForReports(filters, tenantId),
      prisma.penalty.findMany({
        where: {
          tenantId,
          isActive: true,
          month: filters.month,
          dseName: filters.dseName
        }
      })
    ]);

    const penaltyByApplication = new Map<string, { amount: number; reasons: string[] }>();
    for (const penalty of penalties) {
      const key = penalty.applicationNo ?? `${penalty.month}:${penalty.dseName}`;
      const item = penaltyByApplication.get(key) ?? { amount: 0, reasons: [] };
      item.amount = roundMoney(item.amount + Number(penalty.amount));
      item.reasons.push(penalty.reason);
      penaltyByApplication.set(key, item);
    }

    const applied = new Set<string>();
    return rows.map((row) => {
      const penaltyKey = row.applicationNo;
      const penalty = !applied.has(penaltyKey)
        ? penaltyByApplication.get(penaltyKey) ?? { amount: 0, reasons: [] }
        : { amount: 0, reasons: [] };
      applied.add(penaltyKey);
      const difference = roundMoney(Number(row.difference));
      const given = roundMoney(Number(row.given));
      const dseDeduction = roundMoney(Math.min(penalty.amount, given));
      const companyDeduction = roundMoney(Math.max(penalty.amount - given, 0));
      return {
        id: row.id,
        ...(row.rawData as Record<string, unknown>),
        Month: row.month,
        DSA: row.dsa,
        "Application Ref No": row.applicationNo,
        "Customer Name": row.customerName,
        "Card Type": row.cardType,
        Bank: row.bank,
        "USER NAME": row.userName,
        "DSE Name": row.dseName,
        "96%": Number(row.payout96),
        GIVEN: given,
        Difference: difference,
        Penalty: roundMoney(penalty.amount),
        "DSE Penalty Deduction": dseDeduction,
        "Company Profit Deduction": companyDeduction,
        "Final Given": roundMoney(given - dseDeduction),
        "Penalty Reason": penalty.reasons.join("; "),
        "Final Profit": roundMoney(difference - companyDeduction)
      };
    });
  }
}
