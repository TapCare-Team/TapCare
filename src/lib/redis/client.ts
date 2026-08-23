import { Redis } from "@upstash/redis";

/**
 * Redis is disposable coordination infrastructure only. PostgreSQL remains
 * TapCare's source of truth for all application and audit data.
 */
function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

// The application has one shared client. Callers must handle a missing client
// as an unavailable optional backend, rather than treating Redis as authority.
export const redis = createRedisClient();
