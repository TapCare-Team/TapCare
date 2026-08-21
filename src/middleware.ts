import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";

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
    "/api/v1/admin/:path*"
  ]
};
