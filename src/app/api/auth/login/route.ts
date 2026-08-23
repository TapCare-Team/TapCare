import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateUser, createUserSession } from "@/lib/auth";
import { loginSchema } from "@/modules/auth/contracts/login.contract";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS
} from "@/modules/auth/domain/session";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";
import {
  checkLoginAccountLimit,
  checkLoginIpLimit
} from "@/lib/rate-limit/limiters";
import {
  rateLimitedRedirect,
  requestIp
} from "@/lib/rate-limit/request";

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL("/login?error=invalid", request.url)
    );
  }

  // Protect expensive password verification from excessive requests
  // originating from one source.
  const ipLimit = await checkLoginIpLimit(requestIp(request));

  if (!ipLimit.allowed) {
    return rateLimitedRedirect(
      ipLimit,
      request,
      "/login?error=rate_limited"
    );
  }

  const user = await authenticateUser(
    parsed.data.email,
    parsed.data.password
  );

  if (!user) {
    // Count account-level failures only after authentication actually fails.
    // A correct password is therefore never locked out by this bucket.
    const accountLimit = await checkLoginAccountLimit(
      parsed.data.email
    );

    if (!accountLimit.allowed) {
      return rateLimitedRedirect(
        accountLimit,
        request,
        "/login?error=rate_limited"
      );
    }

    return NextResponse.redirect(
      new URL("/login?error=invalid", request.url)
    );
  }

  const { sessionToken } = await createUserSession(user.id);

  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return NextResponse.redirect(
    new URL(defaultRouteForUser(user), request.url)
  );
}
