import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit/limiters";

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
}

export function rateLimitedResponse(result: RateLimitResult) {
  const retryAfter = result.retryAfterSeconds ?? 60;
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
