import { NextRequest } from "next/server";
import { DashboardService } from "@/lib/services/dashboard-service";
import { withApiGuard } from "@/lib/security/api";

const dashboardService = new DashboardService();

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => dashboardService.getDashboard(request.nextUrl.searchParams.get("tenantId") ?? "default"));
}
