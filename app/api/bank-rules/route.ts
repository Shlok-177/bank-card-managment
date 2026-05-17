import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiGuard } from "@/lib/security/api";
import { bankRuleSchema } from "@/lib/validators/bank-rule";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () =>
    prisma.bankRule.findMany({
      where: { tenantId: request.nextUrl.searchParams.get("tenantId") ?? "default" },
      orderBy: [{ bank: "asc" }, { createdAt: "desc" }]
    })
  );
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const payload = bankRuleSchema.parse(await request.json());
    return prisma.bankRule.create({ data: { ...payload, tenantId: "default" } });
  });
}
