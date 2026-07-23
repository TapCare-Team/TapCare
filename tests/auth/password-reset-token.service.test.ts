import { describe, expect, it } from "vitest";
import {
  generatePasswordResetToken,
  hashPasswordResetToken
} from "@/modules/auth/services/password-reset-token.service";

describe("password-reset-token.service", () => {
  it("generates opaque reset tokens and stores only hashes", () => {
    const token = generatePasswordResetToken();
    const hash = hashPasswordResetToken(token);

    expect(token).toHaveLength(43);
    expect(hash).not.toBe(token);
    expect(hashPasswordResetToken(token)).toBe(hash);
  });
});
