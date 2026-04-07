import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  canAccessOfficerSurface: vi.fn(),
  listByIds: vi.fn(),
  listAll: vi.fn(),
  findDuplicateAddress: vi.fn(),
  create: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured
}));

vi.mock("@/modules/auth/services/access-control.service", () => ({
  canAccessOfficerSurface: mocks.canAccessOfficerSurface
}));

vi.mock("@/modules/households/repositories/prisma-sites.repository", () => ({
  PrismaSitesRepository: class {
    listByIds = mocks.listByIds;
    listAll = mocks.listAll;
  }
}));

vi.mock("@/modules/households/repositories/mock-sites.repository", () => ({
  MockSitesRepository: class {
    listByIds = mocks.listByIds;
    listAll = mocks.listAll;
  }
}));

vi.mock("@/modules/households/repositories/prisma-households.repository", () => ({
  PrismaHouseholdsRepository: class {
    findDuplicateAddress = mocks.findDuplicateAddress;
    create = mocks.create;
  }
}));

vi.mock("@/modules/households/repositories/mock-households.repository", () => ({
  MockHouseholdsRepository: class {
    findDuplicateAddress = mocks.findDuplicateAddress;
    create = mocks.create;
  }
}));

const officerUser = {
  id: "user-officer",
  displayName: "Officer Tan",
  role: "OFFICER" as const,
  siteIds: ["site-bedok", "site-tampines"],
  householdIds: []
};

describe("household-management.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.canAccessOfficerSurface.mockReturnValue(true);
    mocks.listByIds.mockResolvedValue([
      { id: "site-bedok", code: "SGO-BEDOK", name: "SGO Bedok", region: "East" },
      { id: "site-tampines", code: "SGO-TAMP", name: "SGO Tampines", region: "East" }
    ]);
    mocks.listAll.mockResolvedValue([]);
    mocks.findDuplicateAddress.mockResolvedValue(null);
    mocks.create.mockImplementation(async (input: Record<string, unknown>) => ({
      id: "household-new",
      siteId: input.siteId,
      siteName: input.siteId === "site-bedok" ? "SGO Bedok" : "SGO Tampines",
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      unitNumber: input.unitNumber,
      postalCode: input.postalCode,
      displayAddress: input.displayAddress,
      lastActiveAt: undefined,
      seniorAliases: input.seniorDisplayName ? [input.seniorDisplayName] : [],
      caregiverIds: [],
      stickers: []
    }));
  });

  it("creates a household within an officer's assigned site scope", async () => {
    const { createHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    const household = await createHouseholdForUser(officerUser, {
      siteId: "site-tampines",
      addressLine1: "Blk 18 Bedok South Road",
      unitNumber: "#05-123",
      postalCode: "460018",
      seniorDisplayName: "Mdm Goh"
    });

    expect(mocks.findDuplicateAddress).toHaveBeenCalledWith(
      "site-tampines",
      "Blk 18 Bedok South Road, #05-123, 460018"
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-tampines",
        displayAddress: "Blk 18 Bedok South Road, #05-123, 460018",
        seniorDisplayName: "Mdm Goh"
      })
    );
    expect(household.id).toBe("household-new");
  });

  it("rejects creation outside the officer's assigned site scope", async () => {
    const { createHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    await expect(
      createHouseholdForUser(officerUser, {
        siteId: "site-jurong",
        addressLine1: "Blk 1 Jurong West Street 1"
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Officers can only add households within their assigned satellite scope"
    });

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate household addresses within the same site", async () => {
    const { createHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    mocks.findDuplicateAddress.mockResolvedValueOnce({
      id: "household-existing",
      siteId: "site-bedok",
      siteName: "SGO Bedok",
      addressLine1: "Blk 18 Bedok South Road",
      displayAddress: "Blk 18 Bedok South Road, 460018",
      seniorAliases: [],
      caregiverIds: [],
      stickers: []
    });

    await expect(
      createHouseholdForUser(officerUser, {
        siteId: "site-bedok",
        addressLine1: "Blk 18 Bedok South Road",
        postalCode: "460018"
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "HOUSEHOLD_DUPLICATE_ADDRESS"
    });

    expect(mocks.create).not.toHaveBeenCalled();
  });
});
