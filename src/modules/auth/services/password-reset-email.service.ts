import { logger } from "@/lib/logging/logger";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    logger.warn("password_reset_email_not_configured");
    return false;
  }

  const escapedResetUrl = escapeHtml(input.resetUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: "Reset your TapCare password",
      text: [
        "You requested a TapCare password reset.",
        "",
        "Open this link to choose a new password:",
        input.resetUrl,
        "",
        "This link expires in 30 minutes. If you did not request this, ignore this email."
      ].join("\n"),
      html: `
        <p>You requested a TapCare password reset.</p>
        <p><a href="${escapedResetUrl}">Choose a new password</a></p>
        <p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>
      `
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    logger.warn("password_reset_email_failed", {
      status: response.status,
      error: payload?.message ?? "unknown"
    });
    return false;
  }

  return true;
}
