import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiGuard } from "@/lib/security/api";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () =>
    prisma.auditLog.findMany({
      where: {
        tenantId: request.nextUrl.searchParams.get("tenantId") ?? "default",
        entity: request.nextUrl.searchParams.get("entity") ?? undefined,
        entityId: request.nextUrl.searchParams.get("entityId") ?? undefined
      },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200
    })
  );
}
