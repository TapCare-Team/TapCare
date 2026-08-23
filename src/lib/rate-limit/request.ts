import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit/limiters";

export function requestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

function retryAfterSeconds(result: RateLimitResult) {
  return result.retryAfterSeconds ?? 60;
}

export function rateLimitedResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds(result))
      }
    }
  );
}

export function rateLimitedRedirect(
  result: RateLimitResult,
  request: Request,
  destination: string
) {
  const response = NextResponse.redirect(new URL(destination, request.url));

  response.headers.set(
    "Retry-After",
    String(retryAfterSeconds(result))
  );

  return response;
}
