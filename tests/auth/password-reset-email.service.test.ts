import { afterEach, describe, expect, it, vi } from "vitest";
import { isPasswordResetEmailConfigured } from "@/modules/auth/services/password-reset-email.service";

describe("password-reset-email.service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires both Resend API key and sender address", () => {
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    expect(isPasswordResetEmailConfigured()).toBe(false);

    vi.stubEnv("AUTH_EMAIL_FROM", "TapCare <noreply@example.com>");
    expect(isPasswordResetEmailConfigured()).toBe(true);
  });
});
