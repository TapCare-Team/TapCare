import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), transaction: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({ prisma: { sticker: { findUnique: mocks.findUnique, update: mocks.update }, $transaction: mocks.transaction } }));
vi.mock("@/modules/households/repositories/prisma-mappers", () => ({ mapPrismaSticker: vi.fn((sticker) => sticker) }));

describe("PrismaStickersRepository physical-tag safeguards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation((callback) => callback({ sticker: { update: mocks.update } }));
  });

  it("rejects deletion of a sticker with a tested physical tag", async () => {
    mocks.findUnique.mockResolvedValue({ id: "sticker-1", physicalTagTestedAt: new Date(), destinationConfigId: null, pageConfigId: null });
    const { PrismaStickersRepository } = await import("@/modules/stickers/repositories/prisma-stickers.repository");
    await expect(new PrismaStickersRepository().delete("sticker-1")).rejects.toMatchObject({ code: "TESTED_STICKER_DELETE_BLOCKED" });
  });

  it("resets the physical test when a sticker is reassigned", async () => {
    mocks.update.mockResolvedValue({ id: "sticker-1", physicalTagTestedAt: null });
    const { PrismaStickersRepository } = await import("@/modules/stickers/repositories/prisma-stickers.repository");
    await new PrismaStickersRepository().assignHousehold("sticker-1", "household-2", "site-2");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { householdId: "household-2", siteId: "site-2", physicalTagTestedAt: null } }));
  });

  it("does not alter the public code or physical test during a digital edit", async () => {
    mocks.findUnique.mockResolvedValue({ id: "sticker-1", destinationConfigId: null, pageConfigId: null });
    mocks.update.mockResolvedValue({ id: "sticker-1" });
    const { PrismaStickersRepository } = await import("@/modules/stickers/repositories/prisma-stickers.repository");
    await new PrismaStickersRepository().update("sticker-1", { name: "Updated name" });
    const finalUpdate = mocks.update.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> };
    expect(finalUpdate.data).not.toHaveProperty("publicCode");
    expect(finalUpdate.data).not.toHaveProperty("physicalTagTestedAt");
  });
});
