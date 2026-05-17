import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class AuditService {
  async log(input: {
    tenantId?: string;
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  }) {
    const actorId = input.actorId
      ? (await prisma.user.findUnique({ where: { id: input.actorId }, select: { id: true } }))?.id
      : undefined;
    return prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? "default",
        actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata,
        oldValue: input.oldValue,
        newValue: input.newValue
      }
    });
  }
}
