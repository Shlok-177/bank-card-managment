import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser(request: NextRequest) {
  const userId = request.cookies.get("bpms_session")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, name: true, email: true, role: true, tenantId: true }
  });
}

export async function requireCurrentUser(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
