import { NextRequest } from "next/server";
import { ReportService } from "@/lib/services/report-service";
import { withApiGuard } from "@/lib/security/api";
import { reportFilterSchema } from "@/lib/validators/upload";

const reportService = new ReportService();

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const type = (params.type as "bank" | "dse" | "user" | "monthly" | "profit" | "detail") ?? "bank";
    const filters = reportFilterSchema.parse(params);
    if (type === "detail") {
      return { data: await reportService.detail(filters, params.tenantId ?? "default") };
    }
    return reportService.generate(type, filters, params.tenantId ?? "default");
  });
}
