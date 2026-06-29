import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken } from "@/modules/auth/services/session-token.service";

describe("session-token.service", () => {
  it("generates opaque session tokens and stores only stable hashes", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    expect(token).toHaveLength(43);
    expect(hash).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hash);
  });
});
