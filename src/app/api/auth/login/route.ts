import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listLoginUsers } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const userId = formData.get("userId");

  if (typeof userId !== "string" || userId.length === 0) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const users = await listLoginUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  cookies().set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  const destination = defaultRouteForUser(user);

  return NextResponse.redirect(new URL(destination, request.url));
}
