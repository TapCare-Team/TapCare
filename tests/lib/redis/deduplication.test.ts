import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock("@/lib/redis/client", () => ({
  redis: { set: mocks.set }
}));

import { claimDeduplicationKey } from "@/lib/redis/deduplication";

describe("claimDeduplicationKey", () => {
  beforeEach(() => {
    mocks.set.mockReset();
  });

  it("uses atomic NX/EX semantics and reports only the first claim", async () => {
    mocks.set.mockResolvedValueOnce("OK").mockResolvedValueOnce(null);
    const claim = { namespace: "notification", key: "user-1:signal-1:email", ttlSeconds: 3600 };

    await expect(claimDeduplicationKey(claim)).resolves.toBe(true);
    await expect(claimDeduplicationKey(claim)).resolves.toBe(false);
    expect(mocks.set).toHaveBeenCalledWith("tapcare:dedup:notification:user-1:signal-1:email", "1", {
      nx: true,
      ex: 3600
    });
  });

  it("keeps namespaces independent", async () => {
    mocks.set.mockResolvedValue("OK");
    await claimDeduplicationKey({ namespace: "sticker-open", key: "same", ttlSeconds: 5 });
    await claimDeduplicationKey({ namespace: "notification", key: "same", ttlSeconds: 60 });
    expect(mocks.set.mock.calls[0]?.[0]).not.toBe(mocks.set.mock.calls[1]?.[0]);
  });

  it("fails open when Redis is unavailable", async () => {
    mocks.set.mockRejectedValueOnce(new Error("unavailable"));
    await expect(claimDeduplicationKey({ namespace: "sticker-open", key: "a", ttlSeconds: 5 })).resolves.toBe(true);
  });
});
