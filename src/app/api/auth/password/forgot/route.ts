import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/modules/auth/contracts/login.contract";
import { sendPasswordResetEmail } from "@/modules/auth/services/password-reset-email.service";
import { authMessages } from "@/modules/shared/messages";

function resetUrlForRequest(request: Request, token: string) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  const baseUrl = configuredBaseUrl || new URL(request.url).origin;
  return new URL(`/reset-password?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Enter a valid email address."
      },
      { status: 400 }
    );
  }

  const result = await requestPasswordReset(parsed.data);
  const payload: { message: string; resetUrl?: string } = {
    message: authMessages.passwordResetRequested
  };

  const resetUrl = result.token ? resetUrlForRequest(request, result.token) : "";
  if (resetUrl) {
    await sendPasswordResetEmail({
      to: parsed.data.email,
      resetUrl
    });
  }

  if (process.env.NODE_ENV !== "production" && result.token) {
    payload.resetUrl = resetUrl;
  }

  return NextResponse.json(payload);
}
