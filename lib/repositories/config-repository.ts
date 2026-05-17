import { prisma } from "@/lib/prisma";

export class ConfigRepository {
  getColumnMappings(tenantId = "default") {
    return prisma.columnMapping.findMany({ where: { tenantId }, orderBy: { internalField: "asc" } });
  }

  getBankRules(tenantId = "default") {
    return prisma.bankRule.findMany({
      where: { tenantId },
      orderBy: [{ bank: "asc" }, { createdAt: "desc" }]
    });
  }
}
