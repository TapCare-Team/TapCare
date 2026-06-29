import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateUser, createUserSession } from "@/lib/auth";
import { loginSchema } from "@/modules/auth/contracts/login.contract";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/modules/auth/domain/session";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  const { sessionToken } = await createUserSession(user.id);
  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  const destination = defaultRouteForUser(user);

  return NextResponse.redirect(new URL(destination, request.url));
}
