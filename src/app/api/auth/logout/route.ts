import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeUserSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";

export async function POST(request: Request) {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    await revokeUserSession(sessionToken);
  }

  cookies().delete(SESSION_COOKIE_NAME);
  return NextResponse.redirect(new URL("/login", request.url));
}
