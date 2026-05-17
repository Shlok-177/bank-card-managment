import { NextRequest } from "next/server";
import { UploadService } from "@/lib/services/upload-service";
import { withApiGuard } from "@/lib/security/api";
import { fileValidationSchema } from "@/lib/validators/upload";

const uploadService = new UploadService();

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "File is required" };
    }

    fileValidationSchema.parse({ name: file.name, size: file.size });
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await uploadService.validateFile(buffer, String(formData.get("tenantId") ?? "default"), {
      month: String(formData.get("month") ?? ""),
      mode: (formData.get("mode") as "NEW" | "REPLACE" | "MERGE" | null) ?? "NEW"
    });

    return {
      ...validation,
      validRows: validation.validRows.slice(0, 25)
    };
  });
}
