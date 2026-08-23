import { createHash } from "node:crypto";

export function normalizeEmailIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeIpIdentifier(value: string | null) {
  return (value ?? "unknown").split(",")[0]?.trim().toLowerCase() || "unknown";
}

export function hashRateLimitIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function accountRateLimitIdentifier(email: string) {
  return hashRateLimitIdentifier(normalizeEmailIdentifier(email));
}

export function ipRateLimitIdentifier(ip: string | null) {
  return hashRateLimitIdentifier(normalizeIpIdentifier(ip));
}
