import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createUserSession, signInWithVerifiedOAuthProfile } from "@/lib/auth";
import {
  OAUTH_NONCE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME
} from "@/modules/auth/domain/oauth";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/modules/auth/domain/session";
import { exchangeGoogleCodeForProfile } from "@/modules/auth/services/google-oauth.service";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
  response.cookies.delete(OAUTH_NONCE_COOKIE_NAME);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get(OAUTH_STATE_COOKIE_NAME)?.value;
  const storedNonce = cookies().get(OAUTH_NONCE_COOKIE_NAME)?.value;

  try {
    if (!code || !state || !storedState || !storedNonce || state !== storedState) {
      return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=oauth_state", request.url)));
    }

    const profile = await exchangeGoogleCodeForProfile({
      requestUrl: request.url,
      code,
      expectedNonce: storedNonce
    });
    const user = await signInWithVerifiedOAuthProfile(profile);
    const { sessionToken } = await createUserSession(user.id);
    const response = NextResponse.redirect(new URL(defaultRouteForUser(user), request.url));

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS
    });

    return clearOAuthCookies(response);
  } catch {
    return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google", request.url)));
  }
}
