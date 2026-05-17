import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { rateLimit } from "./rate-limit";

export function withApiGuard<T>(request: NextRequest, handler: () => Promise<T>) {
  const limit = rateLimit(request);
  if (!limit.ok) {
    return Promise.resolve(
      NextResponse.json({ error: "Too many requests", retryAfter: limit.retryAfter }, { status: 429 })
    );
  }

  return handler()
    .then((data) => (data instanceof Response ? data : NextResponse.json(data)))
    .catch((error) => {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: "Validation failed", details: error.flatten() }, { status: 400 });
      }

      console.error(error);
      return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    });
}
