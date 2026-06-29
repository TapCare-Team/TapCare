import { NextResponse } from "next/server";
import {
  OAUTH_COOKIE_MAX_AGE_SECONDS,
  OAUTH_NONCE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME
} from "@/modules/auth/domain/oauth";
import { buildGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "@/modules/auth/services/google-oauth.service";
import { generateOAuthSecret } from "@/modules/auth/services/oauth-state.service";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const state = generateOAuthSecret();
  const nonce = generateOAuthSecret();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS
  };

  const response = NextResponse.redirect(buildGoogleAuthorizationUrl({ requestUrl: request.url, state, nonce }));
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
  response.cookies.set(OAUTH_NONCE_COOKIE_NAME, nonce, cookieOptions);

  return response;
}
