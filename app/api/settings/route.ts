import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiGuard } from "@/lib/security/api";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () =>
    prisma.columnMapping.findMany({
      where: { tenantId: request.nextUrl.searchParams.get("tenantId") ?? "default" },
      orderBy: { internalField: "asc" }
    })
  );
}

export async function PUT(request: NextRequest) {
  return withApiGuard(request, async () => {
    const payload = (await request.json()) as Array<{ internalField: string; aliases: string[]; required: boolean }>;
    const updates = await Promise.all(
      payload.map((mapping) =>
        prisma.columnMapping.upsert({
          where: { tenantId_internalField: { tenantId: "default", internalField: mapping.internalField } },
          update: { aliases: mapping.aliases, required: mapping.required },
          create: { tenantId: "default", ...mapping }
        })
      )
    );
    return updates;
  });
}
