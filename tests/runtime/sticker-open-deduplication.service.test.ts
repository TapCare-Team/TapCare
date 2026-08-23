import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimDeduplicationKey: vi.fn(),
  checkStickerAnalyticsLimit: vi.fn()
}));

vi.mock("@/lib/redis/deduplication", () => ({
  claimDeduplicationKey: mocks.claimDeduplicationKey
}));

vi.mock("@/lib/rate-limit/limiters", () => ({
  checkStickerAnalyticsLimit: mocks.checkStickerAnalyticsLimit
}));

import { shouldRecordStickerOpened } from "@/modules/runtime/services/sticker-open-deduplication.service";

describe("shouldRecordStickerOpened", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.checkStickerAnalyticsLimit.mockResolvedValue({
      allowed: true
    });

    mocks.claimDeduplicationKey.mockResolvedValue(true);
  });

  it("records the first normal sticker open", async () => {
    await expect(
      shouldRecordStickerOpened(
        "public-code-1",
        "public-client-1"
      )
    ).resolves.toBe(true);

    expect(
      mocks.checkStickerAnalyticsLimit
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.claimDeduplicationKey
    ).toHaveBeenCalledTimes(1);
  });

  it("checks the broad analytics ceiling before deduplication", async () => {
    mocks.checkStickerAnalyticsLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 30
    });

    await expect(
      shouldRecordStickerOpened(
        "public-code-1",
        "public-client-1"
      )
    ).resolves.toBe(false);

    expect(
      mocks.checkStickerAnalyticsLimit
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.claimDeduplicationKey
    ).not.toHaveBeenCalled();
  });

  it("suppresses a repeated tap inside the deduplication window", async () => {
    mocks.claimDeduplicationKey.mockResolvedValueOnce(false);

    await expect(
      shouldRecordStickerOpened(
        "public-code-1",
        "public-client-1"
      )
    ).resolves.toBe(false);
  });

  it("does not deduplicate when no public client identifier exists", async () => {
    await expect(
      shouldRecordStickerOpened("public-code-1")
    ).resolves.toBe(true);

    expect(
      mocks.checkStickerAnalyticsLimit
    ).not.toHaveBeenCalled();

    expect(
      mocks.claimDeduplicationKey
    ).not.toHaveBeenCalled();
  });

  it("keeps different clients independent through their hashed keys", async () => {
    await shouldRecordStickerOpened(
      "public-code-1",
      "client-a"
    );

    await shouldRecordStickerOpened(
      "public-code-1",
      "client-b"
    );

    const firstKey =
      mocks.claimDeduplicationKey.mock.calls[0]?.[0]?.key;

    const secondKey =
      mocks.claimDeduplicationKey.mock.calls[1]?.[0]?.key;

    expect(firstKey).not.toBe(secondKey);
  });
});
