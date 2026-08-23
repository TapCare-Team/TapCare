import { logger } from "@/lib/logging/logger";
import { redis } from "@/lib/redis/client";

export type DeduplicationClaim = {
  namespace: string;
  key: string;
  ttlSeconds: number;
};

function redisKey({ namespace, key }: DeduplicationClaim) {
  return `tapcare:dedup:${namespace}:${key}`;
}

/** Atomically claims a short-lived coordination key using Redis SET NX EX. */
export async function claimDeduplicationKey(claim: DeduplicationClaim): Promise<boolean> {
  if (!redis) {
    logger.warn("redis_unavailable", { operation: "deduplication", namespace: claim.namespace });
    return true;
  }

  try {
    const result = await redis.set(redisKey(claim), "1", { nx: true, ex: claim.ttlSeconds });
    return result === "OK";
  } catch (error) {
    logger.warn("redis_unavailable", {
      operation: "deduplication",
      namespace: claim.namespace,
      error: error instanceof Error ? error.message : "unknown"
    });
    // Failure-open: a Redis outage must not block the public sticker runtime.
    return true;
  }
}
