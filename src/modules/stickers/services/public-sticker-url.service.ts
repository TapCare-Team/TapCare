const FALLBACK_PUBLIC_STICKER_BASE_URL = "http://localhost:3000";

export function buildPublicStickerUrl(publicCode: string) {
  const baseUrl = (process.env.PUBLIC_STICKER_BASE_URL ?? process.env.APP_BASE_URL ?? FALLBACK_PUBLIC_STICKER_BASE_URL)
    .trim()
    .replace(/\/+$/, "");
  return `${baseUrl}/t/${publicCode.trim()}`;
}
