import { NextRequest, NextResponse } from "next/server";
import { isSecureRequest } from "@/lib/security/cookies";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("bpms_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0
  });
  return response;
}
