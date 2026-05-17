import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/security/auth";
import { withApiGuard } from "@/lib/security/api";

export async function GET(request: NextRequest) {
  return withApiGuard(request, async () => {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return { user };
  });
}
