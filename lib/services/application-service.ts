import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApplicationRepository } from "@/lib/repositories/application-repository";
import { AuditService } from "@/lib/services/audit-service";
import { RecalculationService } from "@/lib/services/recalculation-service";
import type { EditableApplicationInput } from "@/types/domain";

const applicationRepository = new ApplicationRepository();
const auditService = new AuditService();
const recalculationService = new RecalculationService();

export class ApplicationService {
  async update(id: string, input: EditableApplicationInput, actorId?: string, tenantId = "default") {
    const validActorId = actorId
      ? (await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } }))?.id
      : undefined;
    const { existing, updated } = await applicationRepository.updateApplication(id, input, validActorId, tenantId);

    await auditService.log({
      tenantId,
      actorId: validActorId,
      action: "application.updated",
      entity: "application",
      entityId: id,
      oldValue: JSON.parse(JSON.stringify(existing)) as Prisma.InputJsonValue,
      newValue: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonValue
    });

    await recalculationService.refreshMonth(updated.month, tenantId);
    return updated;
  }
}
