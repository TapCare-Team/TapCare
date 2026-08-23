import { describe, expect, it } from "vitest";
import {
  accountRateLimitIdentifier,
  hashRateLimitIdentifier,
  ipRateLimitIdentifier,
  normalizeEmailIdentifier
} from "@/lib/rate-limit/identifiers";

describe("rate-limit identifiers", () => {
  it("normalizes and deterministically hashes account identifiers", () => {
    expect(normalizeEmailIdentifier(" Jane@Example.com ")).toBe("jane@example.com");
    expect(accountRateLimitIdentifier("Jane@Example.com")).toBe(accountRateLimitIdentifier(" jane@example.com "));
    expect(accountRateLimitIdentifier("jane@example.com")).not.toBe(accountRateLimitIdentifier("other@example.com"));
  });

  it("never uses raw emails or IP addresses as Redis identifier values", () => {
    const email = "user@example.com";
    const ip = "192.168.1.23";
    expect(accountRateLimitIdentifier(email)).not.toContain(email);
    expect(ipRateLimitIdentifier(ip)).not.toContain(ip);
    expect(hashRateLimitIdentifier(email)).toHaveLength(64);
  });
});
