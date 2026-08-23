import { Ratelimit } from "@upstash/ratelimit";
import { logger } from "@/lib/logging/logger";
import { redis } from "@/lib/redis/client";
import { RATE_LIMITS } from "@/lib/rate-limit/config";
import { accountRateLimitIdentifier, ipRateLimitIdentifier } from "@/lib/rate-limit/identifiers";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

type LimiterName = "loginIp" | "loginAccount" | "signupIp" | "passwordResetIp" | "passwordResetAccount" | "stickerAnalytics";

const limiters = redis
  ? (Object.fromEntries(
      (Object.keys(RATE_LIMITS).filter((name) => name !== "stickerOpenDedupSeconds") as LimiterName[]).map((name) => {
        const config = RATE_LIMITS[name];
        return [
          name,
          new Ratelimit({
            redis: redis!,
            limiter: Ratelimit.slidingWindow(config.limit, config.window),
            prefix: {
              loginIp: "tapcare:rl:login:ip",
              loginAccount: "tapcare:rl:login:account",
              signupIp: "tapcare:rl:signup:ip",
              passwordResetIp: "tapcare:rl:password-reset:ip",
              passwordResetAccount: "tapcare:rl:password-reset:account",
              stickerAnalytics: "tapcare:rl:sticker-analytics"
            }[name]
          })
        ];
      })
    ) as Record<LimiterName, Ratelimit>)
  : null;

async function checkLimit(name: LimiterName, identifier: string): Promise<RateLimitResult> {
  const limiter = limiters?.[name];
  if (!limiter) {
    logger.warn("rate_limit_backend_unavailable", { limiter: name });
    return { allowed: true };
  }

  try {
    const result = await limiter.limit(identifier);
    if (result.success) {
      return { allowed: true };
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    logger.warn("rate_limit_exceeded", { limiter: name, retryAfterSeconds });
    return { allowed: false, retryAfterSeconds };
  } catch (error) {
    logger.warn("rate_limit_backend_unavailable", {
      limiter: name,
      error: error instanceof Error ? error.message : "unknown"
    });
    return { allowed: true };
  }
}

export function checkLoginIpLimit(ip: string | null) { return checkLimit("loginIp", ipRateLimitIdentifier(ip)); }
export function checkLoginAccountLimit(email: string) { return checkLimit("loginAccount", accountRateLimitIdentifier(email)); }
export function checkSignupIpLimit(ip: string | null) { return checkLimit("signupIp", ipRateLimitIdentifier(ip)); }
export function checkPasswordResetIpLimit(ip: string | null) { return checkLimit("passwordResetIp", ipRateLimitIdentifier(ip)); }
export function checkPasswordResetAccountLimit(email: string) { return checkLimit("passwordResetAccount", accountRateLimitIdentifier(email)); }
export function checkStickerAnalyticsLimit(publicCode: string, clientHash: string) {
  return checkLimit("stickerAnalytics", `${publicCode}:${clientHash}`);
}
