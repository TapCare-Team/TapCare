import { createHash } from "node:crypto";
import { logger } from "@/lib/logging/logger";
import { claimDeduplicationKey } from "@/lib/redis/deduplication";
import { RATE_LIMITS } from "@/lib/rate-limit/config";
import { checkStickerAnalyticsLimit } from "@/lib/rate-limit/limiters";

export async function shouldRecordStickerOpened(publicCode: string, publicClientId?: string) {
  // A missing identifier is treated as a unique visitor. It must never affect
  // the sticker action itself; it only makes analytics less deduplicated.
  if (!publicClientId) {
    return true;
  }

  const clientHash = createHash("sha256").update(publicClientId).digest("hex");
  const claimed = await claimDeduplicationKey({
    namespace: "sticker-open",
    key: `${publicCode}:${clientHash}`,
    ttlSeconds: RATE_LIMITS.stickerOpenDedupSeconds
  });

  if (!claimed) {
    logger.info("sticker_open_deduplicated", { publicCode });
    return false;
  }

  const ceiling = await checkStickerAnalyticsLimit(publicCode, clientHash);
  if (!ceiling.allowed) {
    logger.warn("sticker_analytics_ceiling_reached", { publicCode });
    return false;
  }

  return true;
}
