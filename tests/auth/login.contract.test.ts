import { describe, expect, it } from "vitest";
import { changePasswordSchema, resetPasswordSchema, signupSchema } from "@/modules/auth/contracts/login.contract";

describe("signupSchema", () => {
  it("accepts a caregiver signup with a strong password", () => {
    const result = signupSchema.safeParse({
      displayName: "Maya Lim",
      email: "maya@example.org",
      password: "TapCare1234!",
      confirmPassword: "TapCare1234!"
    });

    expect(result.success).toBe(true);
  });

  it("rejects weak or mismatched passwords", () => {
    expect(
      signupSchema.safeParse({
        displayName: "Maya Lim",
        email: "maya@example.org",
        password: "password",
        confirmPassword: "different"
      }).success
    ).toBe(false);
  });

  it("applies the same strong password policy to reset and change password", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "a".repeat(43),
        password: "TapCare1234!",
        confirmPassword: "TapCare1234!"
      }).success
    ).toBe(true);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPassword123!",
        password: "weak",
        confirmPassword: "weak"
      }).success
    ).toBe(false);
  });

  it("allows Google-created accounts to set a password without an existing password", () => {
    expect(
      changePasswordSchema.safeParse({
        password: "TapCare1234!",
        confirmPassword: "TapCare1234!"
      }).success
    ).toBe(true);
  });
});
