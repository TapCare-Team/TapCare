import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  householdFindMany: vi.fn(),
  householdFindFirst: vi.fn(),
  householdFindUnique: vi.fn(),
  transaction: vi.fn(),
  householdUpdate: vi.fn(),
  stickerUpdateMany: vi.fn(),
  assignmentUpdateMany: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    household: {
      findMany: mocks.householdFindMany,
      findFirst: mocks.householdFindFirst,
      findUnique: mocks.householdFindUnique
    },
    $transaction: mocks.transaction
  }
}));

describe("PrismaHouseholdsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.householdFindMany.mockResolvedValue([]);
    mocks.householdFindFirst.mockResolvedValue(null);
    mocks.householdFindUnique.mockResolvedValue({ id: "household-1" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        household: {
          update: mocks.householdUpdate
        },
        sticker: {
          updateMany: mocks.stickerUpdateMany
        },
        householdAssignment: {
          updateMany: mocks.assignmentUpdateMany
        }
      })
    );
    mocks.householdUpdate.mockResolvedValue({});
    mocks.stickerUpdateMany.mockResolvedValue({ count: 2 });
    mocks.assignmentUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("lists only active households by id", async () => {
    const { PrismaHouseholdsRepository } = await import(
      "@/modules/households/repositories/prisma-households.repository"
    );
    const repository = new PrismaHouseholdsRepository();

    await repository.listByIds(["household-1"]);

    expect(mocks.householdFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: ["household-1"] },
          status: "ACTIVE"
        }
      })
    );
  });

  it("does not return archived households by id", async () => {
    const { PrismaHouseholdsRepository } = await import(
      "@/modules/households/repositories/prisma-households.repository"
    );
    const repository = new PrismaHouseholdsRepository();

    await repository.getById("household-1");

    expect(mocks.householdFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "household-1",
          status: "ACTIVE"
        }
      })
    );
  });

  it("archives households, disables stickers, and ends caregiver assignments together", async () => {
    const { PrismaHouseholdsRepository } = await import(
      "@/modules/households/repositories/prisma-households.repository"
    );
    const repository = new PrismaHouseholdsRepository();

    await repository.archive("household-1");

    expect(mocks.householdUpdate).toHaveBeenCalledWith({
      where: { id: "household-1" },
      data: { status: "ARCHIVED" }
    });
    expect(mocks.stickerUpdateMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
      data: { status: "DISABLED" }
    });
    expect(mocks.assignmentUpdateMany).toHaveBeenCalledWith({
      where: { householdId: "household-1", endedAt: null },
      data: { endedAt: expect.any(Date) }
    });
  });
});
