import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPublicStickerUrl } from "@/modules/stickers/services/public-sticker-url.service";

describe("public sticker URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the configured canonical base URL without changing the public code", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PUBLIC_STICKER_BASE_URL", "https://tags.tapcare.sg/");
    expect(buildPublicStickerUrl("stable-code")).toBe("https://tags.tapcare.sg/t/stable-code");
  });

  it("fails closed when production physical-tag configuration is absent or insecure", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PUBLIC_STICKER_BASE_URL", "");
    expect(() => buildPublicStickerUrl("code")).toThrow("required in production");
    vi.stubEnv("PUBLIC_STICKER_BASE_URL", "http://tags.tapcare.sg");
    expect(() => buildPublicStickerUrl("code")).toThrow("must use HTTPS");
  });
});
