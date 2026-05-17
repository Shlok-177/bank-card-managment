import { NextRequest } from "next/server";
import { ApplicationService } from "@/lib/services/application-service";
import { withApiGuard } from "@/lib/security/api";
import { applicationUpdateSchema } from "@/lib/validators/application";

const applicationService = new ApplicationService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiGuard(request, async () => {
    const { id } = await params;
    const payload = applicationUpdateSchema.parse(await request.json());
    return applicationService.update(id, payload, request.cookies.get("bpms_session")?.value);
  });
}
