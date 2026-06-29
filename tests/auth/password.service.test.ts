import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password.service";

describe("password.service", () => {
  it("hashes passwords without storing the raw secret", async () => {
    const hash = await hashPassword("TapCare1234!");

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain("TapCare1234!");
  });

  it("verifies only the matching password", async () => {
    const hash = await hashPassword("TapCare1234!");

    await expect(verifyPassword("TapCare1234!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
