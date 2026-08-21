const FALLBACK_PUBLIC_STICKER_BASE_URL = "http://localhost:3000";

export function buildPublicStickerUrl(publicCode: string) {
  const configuredBaseUrl = process.env.PUBLIC_STICKER_BASE_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configuredBaseUrl) {
    throw new Error("PUBLIC_STICKER_BASE_URL is required in production for physical sticker setup.");
  }

  const baseUrl = (configuredBaseUrl ?? FALLBACK_PUBLIC_STICKER_BASE_URL).replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && !baseUrl.startsWith("https://")) {
    throw new Error("PUBLIC_STICKER_BASE_URL must use HTTPS in production.");
  }

  return `${baseUrl}/t/${publicCode.trim()}`;
}
