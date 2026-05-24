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

      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (error instanceof Error && error.message === "APPLICATION_NOT_FOUND") {
        return NextResponse.json({ error: "Application number not found in active uploaded data" }, { status: 404 });
      }

      if (error instanceof Error && error.message === "PENALTY_ALREADY_EXISTS") {
        return NextResponse.json({ error: "A penalty already exists for this application number. Remove it first to add a new one." }, { status: 409 });
      }

      console.error(error);
      return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    });
}
