import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/modules/auth/contracts/login.contract";
import { isDomainError } from "@/modules/shared/errors";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

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
    await resetPassword(parsed.data);
    return NextResponse.json({ message: "Password reset. You can now sign in with your new password." });
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Unable to reset password." }, { status: 400 });
  }
}
