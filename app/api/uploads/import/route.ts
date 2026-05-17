import { NextRequest } from "next/server";
import { UploadService } from "@/lib/services/upload-service";
import { withApiGuard } from "@/lib/security/api";
import { fileValidationSchema, uploadMetadataSchema } from "@/lib/validators/upload";

const uploadService = new UploadService();

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "File is required" };
    }

    fileValidationSchema.parse({ name: file.name, size: file.size });
    const metadata = uploadMetadataSchema.parse({
      month: formData.get("month"),
      uploadedById: formData.get("uploadedById") || request.cookies.get("bpms_session")?.value,
      tenantId: formData.get("tenantId") || undefined,
      mode: formData.get("mode") || undefined
    });

    return uploadService.importFile({
      fileName: file.name,
      fileSize: file.size,
      month: metadata.month,
      uploadedById: metadata.uploadedById,
      tenantId: metadata.tenantId,
      mode: metadata.mode,
      buffer: Buffer.from(await file.arrayBuffer())
    });
  });
}
