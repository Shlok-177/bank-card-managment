import { NextRequest } from "next/server";

export function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return forwardedProto === "https" || request.nextUrl.protocol === "https:";
}
