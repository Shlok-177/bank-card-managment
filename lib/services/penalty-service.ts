import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/lib/services/audit-service";
import { RecalculationService } from "@/lib/services/recalculation-service";
import { roundMoney } from "@/lib/utils";

const auditService = new AuditService();
const recalculationService = new RecalculationService();

export class PenaltyService {
  async list(month?: string, tenantId = "default") {
    return prisma.penalty.findMany({
      where: { tenantId, month, isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(input: { applicationNo: string; amount: number; reason: string; actorId?: string; tenantId?: string }) {
    const tenantId = input.tenantId ?? "default";
    const actorId = input.actorId
      ? (await prisma.user.findUnique({ where: { id: input.actorId }, select: { id: true } }))?.id
      : undefined;
    const application = await prisma.application.findFirst({
      where: {
        tenantId,
        applicationNo: input.applicationNo.trim(),
        isArchived: false
      },
      select: {
        applicationNo: true,
        month: true,
        dseName: true,
        difference: true
      }
    });

    if (!application) {
      throw new Error("APPLICATION_NOT_FOUND");
    }

    const existingPenalty = await prisma.penalty.findFirst({
      where: {
        tenantId,
        applicationNo: application.applicationNo,
        isActive: true
      },
      select: { id: true }
    });

    if (existingPenalty) {
      throw new Error("PENALTY_ALREADY_EXISTS");
    }

    await prisma.monthPeriod.upsert({
      where: { tenantId_month: { tenantId, month: application.month } },
      update: {},
      create: { tenantId, month: application.month, status: "PENDING" }
    });

    const penalty = await prisma.penalty.create({
      data: {
        tenantId,
        month: application.month,
        dseName: application.dseName ?? "Unassigned",
        applicationNo: application.applicationNo,
        amount: new Prisma.Decimal(roundMoney(input.amount)),
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
      newValue: JSON.parse(JSON.stringify({ penalty, applicationProfit: Number(application.difference) })) as Prisma.InputJsonValue
    });
    await recalculationService.refreshMonth(application.month, tenantId);

    return { ...penalty, applicationProfit: Number(application.difference) };
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
