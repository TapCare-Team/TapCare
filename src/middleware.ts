import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";

const PUBLIC_CLIENT_COOKIE_NAME = "tapcare_public_client";
const PUBLIC_CLIENT_HEADER_NAME = "x-tapcare-public-client";
const PUBLIC_CLIENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const protectedPrefixes = [
  "/caregiver",
  "/households",
  "/follow-up",
  "/admin",
  "/account",
  "/wrong-account",
  "/api/v1/caregiver",
  "/api/v1/setup",
  "/api/v1/admin"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/t/")) {
    const publicClientId = request.cookies.get(PUBLIC_CLIENT_COOKIE_NAME)?.value || crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    // Never trust a caller-provided header; middleware supplies the value that
    // is also persisted in the first-party cookie.
    requestHeaders.set(PUBLIC_CLIENT_HEADER_NAME, publicClientId);
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    if (!request.cookies.has(PUBLIC_CLIENT_COOKIE_NAME)) {
      response.cookies.set(PUBLIC_CLIENT_COOKIE_NAME, publicClientId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PUBLIC_CLIENT_MAX_AGE_SECONDS
      });
    }

    return response;
  }

  const needsAuth =
    protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/caregiver/:path*",
    "/households/:path*",
    "/follow-up/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/wrong-account",
    "/api/v1/caregiver/:path*",
    "/api/v1/setup/:path*",
    "/api/v1/admin/:path*",
    "/t/:path*"
  ]
};
