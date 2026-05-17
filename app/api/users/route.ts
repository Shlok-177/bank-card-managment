import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/security/auth";
import { withApiGuard } from "@/lib/security/api";
import { createUserSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    await requireCurrentUser(request);
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
  });
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const currentUser = await requireCurrentUser(request);
    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Only admins can create users" }, { status: 403 });
    }

    const payload = createUserSchema.parse(await request.json());
    const { confirmPassword, password, ...user } = payload;
    return prisma.user.create({
      data: {
        ...user,
        passwordHash: await bcrypt.hash(password, 12)
      },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
  });
}
