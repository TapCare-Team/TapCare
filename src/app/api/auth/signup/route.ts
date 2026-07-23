import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createUserSession, signupCaregiver } from "@/lib/auth";
import { signupSchema } from "@/modules/auth/contracts/login.contract";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/modules/auth/domain/session";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json");
}

function isUniqueEmailConflict(error: unknown) {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002" &&
    "meta" in error &&
    error.meta &&
    typeof error.meta === "object" &&
    "target" in error.meta &&
    Array.isArray(error.meta.target) &&
    error.meta.target.includes("email")
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          error: "Check your details and try again.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL("/signup?error=invalid", request.url));
  }

  try {
    const user = await signupCaregiver(parsed.data);
    const { sessionToken } = await createUserSession(user.id);

    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS
    });

    return NextResponse.redirect(new URL(defaultRouteForUser(user), request.url));
  } catch (error) {
    const reason = isUniqueEmailConflict(error) ? "exists" : "invalid";
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          error: reason === "exists" ? "An account with this email already exists." : "Unable to create account.",
          fieldErrors: reason === "exists" ? { email: ["An account with this email already exists."] } : {}
        },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL(`/signup?error=${reason}`, request.url));
  }
}
