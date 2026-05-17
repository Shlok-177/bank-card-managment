import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSecureRequest } from "@/lib/security/cookies";
import { withApiGuard } from "@/lib/security/api";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  return withApiGuard(request, async () => {
    const payload = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user || !user.isActive || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      return { ok: false, error: "Invalid credentials" };
    }

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
    response.cookies.set("bpms_session", user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return response;
  });
}
