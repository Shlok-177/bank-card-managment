import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiGuard } from "@/lib/security/api";
import { userSchema } from "@/lib/validators/auth";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () =>
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    })
  );
}

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const payload = userSchema.parse(await request.json());
    return prisma.user.create({
      data: {
        ...payload,
        passwordHash: await bcrypt.hash("ChangeMe@123", 12)
      },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
  });
}
