import { NextRequest } from "next/server";
import { PenaltyService } from "@/lib/services/penalty-service";
import { withApiGuard } from "@/lib/security/api";
import { penaltySchema } from "@/lib/validators/penalty";

const penaltyService = new PenaltyService();

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () =>
    penaltyService.list(request.nextUrl.searchParams.get("month") ?? undefined, request.nextUrl.searchParams.get("tenantId") ?? "default")
  );
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const payload = penaltySchema.parse(await request.json());
    return penaltyService.create({
      ...payload,
      actorId: request.cookies.get("bpms_session")?.value
    });
  });
}

export async function DELETE(request: NextRequest) {
  return withApiGuard(request, async () => {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return { error: "Penalty id is required" };
    }

    return penaltyService.delete(id, request.cookies.get("bpms_session")?.value);
  });
}
