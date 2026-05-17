import { NextRequest } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 120);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { ok: true, remaining: max - bucket.count };
}
