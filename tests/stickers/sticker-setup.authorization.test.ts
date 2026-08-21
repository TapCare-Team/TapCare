import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  canConfigureHousehold: vi.fn(),
  getHouseholdById: vi.fn(),
  getScopeById: vi.fn(),
  createSticker: vi.fn(),
  updateSticker: vi.fn(),
  deleteSticker: vi.fn(),
  assignHousehold: vi.fn(),
  setPhysicalTagTestedAt: vi.fn(),
  listByHouseholdId: vi.fn(),
  generateDisplayCode: vi.fn(),
  generatePublicCode: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({ isDatabaseConfigured: mocks.isDatabaseConfigured }));
vi.mock("@/modules/auth/services/access-control.service", () => ({
  canConfigureHousehold: mocks.canConfigureHousehold
}));
vi.mock("@/modules/households/repositories/prisma-households.repository", () => ({
  PrismaHouseholdsRepository: class { getById = mocks.getHouseholdById; }
}));
vi.mock("@/modules/stickers/repositories/prisma-stickers.repository", () => ({
  PrismaStickersRepository: class {
    getScopeById = mocks.getScopeById;
    create = mocks.createSticker;
    update = mocks.updateSticker;
    delete = mocks.deleteSticker;
    assignHousehold = mocks.assignHousehold;
    setPhysicalTagTestedAt = mocks.setPhysicalTagTestedAt;
    listByHouseholdId = mocks.listByHouseholdId;
  }
}));
vi.mock("@/modules/stickers/services/sticker-code.service", () => ({
  generateDisplayCode: mocks.generateDisplayCode,
  generatePublicCode: mocks.generatePublicCode
}));

import {
  assignStickerToHouseholdForUser,
  createStickerForUser,
  deleteStickerForUser,
  getStickerForPreviewForUser,
  markStickerPhysicalTagTestedForUser,
  resetStickerPhysicalTagTestForUser,
  updateStickerForUser
} from "@/modules/stickers/services/sticker-setup.service";

const caregiver = {
  id: "caregiver-a",
  displayName: "Caregiver A",
  role: "CAREGIVER" as const,
  siteIds: [],
  householdIds: ["household-a"]
};
const admin = { ...caregiver, id: "admin", role: "ADMIN" as const, householdIds: [] };

describe("sticker setup authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.canConfigureHousehold.mockImplementation((user: { role: string; householdIds: string[] }, householdId: string) =>
      user.role === "ADMIN" || user.householdIds.includes(householdId)
    );
    mocks.getHouseholdById.mockImplementation(async (id: string) => ({ id, siteId: "site-a" }));
    mocks.getScopeById.mockImplementation(async (id: string) => ({
      stickerId: id,
      householdId: id === "sticker-b" ? "household-b" : "household-a",
      siteId: "site-a"
    }));
    mocks.generateDisplayCode.mockResolvedValue("EC-0001");
    mocks.generatePublicCode.mockReturnValue("public-code-1");
    mocks.createSticker.mockResolvedValue({ id: "sticker-new" });
    mocks.updateSticker.mockResolvedValue({ id: "sticker-a" });
    mocks.deleteSticker.mockResolvedValue(true);
    mocks.assignHousehold.mockResolvedValue({ id: "sticker-a", physicalTagTestedAt: null });
    mocks.listByHouseholdId.mockResolvedValue([{ id: "sticker-a", householdId: "household-a" }]);
    mocks.setPhysicalTagTestedAt.mockResolvedValue({ id: "sticker-a" });
  });

  it("allows assigned caregivers and admins to create stickers, but rejects unassigned caregivers", async () => {
    const input = {
      householdId: "household-a",
      name: "Contact",
      isCritical: false,
      stickerType: "EMERGENCY_CONTACT" as const,
      runtimeMode: "DIRECT_REDIRECT" as const,
      status: "ACTIVE" as const,
      destination: { type: "PHONE" as const, value: "+6591234567" }
    };

    await expect(createStickerForUser(caregiver, input)).resolves.toEqual({ id: "sticker-new" });
    await expect(createStickerForUser(caregiver, { ...input, householdId: "household-b" })).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(createStickerForUser(admin, { ...input, householdId: "household-b" })).resolves.toEqual({ id: "sticker-new" });
  });

  it("rejects a caregiver who guesses an unassigned sticker ID before mutation", async () => {
    await expect(updateStickerForUser(caregiver, "sticker-b", { name: "Changed" })).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.updateSticker).not.toHaveBeenCalled();
  });

  it("allows assigned caregivers to mark or reset a physical tag, but rejects guessed sticker IDs", async () => {
    await expect(markStickerPhysicalTagTestedForUser(caregiver, "sticker-a")).resolves.toEqual({ id: "sticker-a" });
    await expect(resetStickerPhysicalTagTestForUser(caregiver, "sticker-a")).resolves.toEqual({ id: "sticker-a" });
    await expect(markStickerPhysicalTagTestedForUser(caregiver, "sticker-b")).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.setPhysicalTagTestedAt).toHaveBeenCalledWith("sticker-a", expect.any(Date));
    expect(mocks.setPhysicalTagTestedAt).toHaveBeenCalledWith("sticker-a", null);
  });

  it("delegates deletion and reassignment through the protected repository operations", async () => {
    await deleteStickerForUser(caregiver, "sticker-a");
    await assignStickerToHouseholdForUser(caregiver, "sticker-a", "household-a");
    expect(mocks.deleteSticker).toHaveBeenCalledWith("sticker-a");
    expect(mocks.assignHousehold).toHaveBeenCalledWith("sticker-a", "household-a", "site-a");
  });

  it("allows an assigned caregiver to preview a sticker from their household", async () => {
    await expect(getStickerForPreviewForUser(caregiver, "household-a", "sticker-a")).resolves.toEqual({ id: "sticker-a", householdId: "household-a" });
  });

  it("denies a caregiver preview of an unassigned household sticker", async () => {
    await expect(getStickerForPreviewForUser(caregiver, "household-b", "sticker-b")).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.listByHouseholdId).not.toHaveBeenCalled();
  });
});
