import { NextRequest, NextResponse } from "next/server";
import { exportReport } from "@/lib/export/export-service";
import { ReportService } from "@/lib/services/report-service";

const reportService = new ReportService();

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const format = (params.format as "excel" | "csv" | "pdf") ?? "excel";
  const rows = await reportService.detail(params);
  const exported = await exportReport(format, rows);

  return new NextResponse(exported.body, {
    headers: {
      "Content-Type": exported.contentType,
      "Content-Disposition": `attachment; filename="${exported.fileName}"`
    }
  });
}
