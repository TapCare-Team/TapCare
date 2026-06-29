import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { changePasswordForUser, getCurrentUser } from "@/lib/auth";
import { changePasswordSchema } from "@/modules/auth/contracts/login.contract";
import { SESSION_COOKIE_NAME } from "@/modules/auth/domain/session";
import { isDomainError } from "@/modules/shared/errors";
import { commonMessages } from "@/modules/shared/messages";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check your password details and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    await changePasswordForUser(user, parsed.data);
    cookies().delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ message: "Password changed. Please sign in again." });
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Unable to change password." }, { status: 400 });
  }
}
