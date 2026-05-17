import { NextRequest } from "next/server";
import { MonthService } from "@/lib/services/month-service";
import { withApiGuard } from "@/lib/security/api";

const monthService = new MonthService();

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => monthService.list(request.nextUrl.searchParams.get("tenantId") ?? "default"));
}
