import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/lib/services/audit-service";
import { RecalculationService } from "@/lib/services/recalculation-service";

const auditService = new AuditService();
const recalculationService = new RecalculationService();

export class PenaltyService {
  async list(month?: string, tenantId = "default") {
    return prisma.penalty.findMany({
      where: { tenantId, month, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(input: { month: string; dseName: string; amount: number; reason: string; actorId?: string; tenantId?: string }) {
    const tenantId = input.tenantId ?? "default";
    const actorId = input.actorId
      ? (await prisma.user.findUnique({ where: { id: input.actorId }, select: { id: true } }))?.id
      : undefined;

    await prisma.monthPeriod.upsert({
      where: { tenantId_month: { tenantId, month: input.month } },
      update: {},
      create: { tenantId, month: input.month, status: "PENDING" }
    });

    const penalty = await prisma.penalty.create({
      data: {
        tenantId,
        month: input.month,
        dseName: input.dseName,
        amount: new Prisma.Decimal(input.amount),
        reason: input.reason,
        createdById: actorId
      }
    });

    await auditService.log({
      tenantId,
      actorId,
      action: "penalty.created",
      entity: "penalty",
      entityId: penalty.id,
      newValue: JSON.parse(JSON.stringify(penalty)) as Prisma.InputJsonValue
    });
    await recalculationService.refreshMonth(input.month, tenantId);

    return penalty;
  }

  async delete(id: string, actorId?: string, tenantId = "default") {
    const penalty = await prisma.penalty.update({
      where: { id },
      data: { isActive: false }
    });
    await auditService.log({
      tenantId,
      actorId,
      action: "penalty.deleted",
      entity: "penalty",
      entityId: id,
      oldValue: JSON.parse(JSON.stringify(penalty)) as Prisma.InputJsonValue
    });
    await recalculationService.refreshMonth(penalty.month, tenantId);
    return penalty;
  }
}
