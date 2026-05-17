import { NextRequest } from "next/server";
import { MonthService } from "@/lib/services/month-service";
import { withApiGuard } from "@/lib/security/api";

const monthService = new MonthService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ month: string }> }) {
  return withApiGuard(request, async () => {
    const { month } = await params;
    return monthService.workspace(decodeURIComponent(month), request.nextUrl.searchParams.get("tenantId") ?? "default");
  });
}
