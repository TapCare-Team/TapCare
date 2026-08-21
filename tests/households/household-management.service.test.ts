import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDataMode: vi.fn(),
  isDatabaseConfigured: vi.fn(),
  canAdministerHousehold: vi.fn(),
  listByIds: vi.fn(),
  listAll: vi.fn(),
  findDuplicateAddress: vi.fn(),
  create: vi.fn(),
  getById: vi.fn(),
  findCaregiverByEmail: vi.fn(),
  assignCaregiver: vi.fn(),
  archive: vi.fn(), unassignCaregiver: vi.fn(), findDuplicateAddressExcludingHousehold: vi.fn(), updateHouseholdAddress: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({
  getDataMode: mocks.getDataMode,
  isDatabaseConfigured: mocks.isDatabaseConfigured
}));

vi.mock("@/modules/auth/services/access-control.service", () => ({
  canAdministerHousehold: mocks.canAdministerHousehold
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
    getById = mocks.getById;
    findCaregiverByEmail = mocks.findCaregiverByEmail;
    assignCaregiver = mocks.assignCaregiver;
    archive = mocks.archive;
    unassignCaregiver = mocks.unassignCaregiver; findDuplicateAddressExcludingHousehold = mocks.findDuplicateAddressExcludingHousehold; updateHouseholdAddress = mocks.updateHouseholdAddress;
  }
}));

vi.mock("@/modules/households/repositories/mock-households.repository", () => ({
  MockHouseholdsRepository: class {
    findDuplicateAddress = mocks.findDuplicateAddress;
    create = mocks.create;
    getById = mocks.getById;
    findCaregiverByEmail = mocks.findCaregiverByEmail;
    assignCaregiver = mocks.assignCaregiver;
    archive = mocks.archive;
  }
}));

const adminUser = {
  id: "user-admin",
  displayName: "Admin Junny",
  role: "ADMIN" as const,
  siteIds: [],
  householdIds: []
};

const caregiverUser = {
  id: "user-caregiver",
  displayName: "Caregiver Maya",
  role: "CAREGIVER" as const,
  siteIds: [],
  householdIds: ["household-1"]
};

describe("household-management.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDataMode.mockReturnValue("database");
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.canAdministerHousehold.mockImplementation((user: { role: string }) => user.role === "ADMIN");
    mocks.listByIds.mockResolvedValue([
      { id: "site-bedok", code: "SGO-BEDOK", name: "SGO Bedok", region: "East" },
      { id: "site-tampines", code: "SGO-TAMP", name: "SGO Tampines", region: "East" }
    ]);
    mocks.listAll.mockResolvedValue([
      { id: "site-bedok", code: "SGO-BEDOK", name: "SGO Bedok", region: "East" },
      { id: "site-tampines", code: "SGO-TAMP", name: "SGO Tampines", region: "East" }
    ]);
    mocks.findDuplicateAddress.mockResolvedValue(null);
    mocks.getById.mockResolvedValue({
      id: "household-1",
      siteId: "site-bedok",
      siteName: "SGO Bedok",
      addressLine1: "Blk 18 Bedok South Road",
      displayAddress: "Blk 18 Bedok South Road, #05-123, 460018",
      seniorAliases: [],
      caregiverIds: [],
      caregiverAssignments: [],
      stickers: []
    });
    mocks.findCaregiverByEmail.mockResolvedValue({
      id: "user-caregiver-1",
      displayName: "Maya Lim",
      email: "maya.lim@example.org"
    });
    mocks.assignCaregiver.mockResolvedValue({
      alreadyAssigned: false,
      household: {
        id: "household-1",
        siteId: "site-bedok",
        siteName: "SGO Bedok",
        addressLine1: "Blk 18 Bedok South Road",
        displayAddress: "Blk 18 Bedok South Road, #05-123, 460018",
        seniorAliases: [],
        caregiverIds: ["user-caregiver-1"],
        caregiverAssignments: [
          {
            caregiverId: "user-caregiver-1",
            displayName: "Maya Lim",
            email: "maya.lim@example.org",
            assignedAt: "2026-06-28T00:00:00.000Z"
          }
        ],
        stickers: []
      }
    });
    mocks.archive.mockResolvedValue(true);
    mocks.unassignCaregiver.mockResolvedValue(true); mocks.findDuplicateAddressExcludingHousehold.mockResolvedValue(null); mocks.updateHouseholdAddress.mockImplementation(async (_id, input) => ({ ...mocks.getById(), ...input }));
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
      caregiverAssignments: [],
      stickers: []
    }));
  });

  it("allows admins to create a household", async () => {
    const { createHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    const household = await createHouseholdForUser(adminUser, {
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

  it("rejects household creation for caregivers", async () => {
    const { createHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    await expect(
      createHouseholdForUser(caregiverUser, {
        siteId: "site-bedok",
        addressLine1: "Blk 1 Jurong West Street 1"
      })
    ).rejects.toMatchObject({
      statusCode: 403
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
      caregiverAssignments: [],
      stickers: []
    });

    await expect(
      createHouseholdForUser(adminUser, {
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

  it("rejects household deletion by caregivers", async () => {
    const { deleteHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    await expect(deleteHouseholdForUser(caregiverUser, "household-1")).rejects.toMatchObject({
      statusCode: 403
    });

    expect(mocks.archive).not.toHaveBeenCalled();
  });

  it("allows admins to archive households", async () => {
    const { deleteHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    await deleteHouseholdForUser(adminUser, "household-1");

    expect(mocks.getById).toHaveBeenCalledWith("household-1");
    expect(mocks.archive).toHaveBeenCalledWith("household-1");
  });

  it("assigns an existing caregiver to an in-scope household", async () => {
    const { assignCaregiverToHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    const result = await assignCaregiverToHouseholdForUser(adminUser, "household-1", {
      email: "Maya.Lim@example.org"
    });

    expect(mocks.findCaregiverByEmail).toHaveBeenCalledWith("maya.lim@example.org");
    expect(mocks.assignCaregiver).toHaveBeenCalledWith("household-1", "user-caregiver-1");
    expect(result.alreadyAssigned).toBe(false);
    expect(result.caregiver.email).toBe("maya.lim@example.org");
  });

  it("rejects caregiver assignment by an assigned caregiver", async () => {
    const { assignCaregiverToHouseholdForUser } = await import("@/modules/households/services/household-management.service");

    await expect(
      assignCaregiverToHouseholdForUser(caregiverUser, "household-1", { email: "maya.lim@example.org" })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.assignCaregiver).not.toHaveBeenCalled();
  });

  it("tells admins when the caregiver has not signed up yet", async () => {
    const { assignCaregiverToHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    mocks.findCaregiverByEmail.mockResolvedValueOnce(null);

    await expect(
      assignCaregiverToHouseholdForUser(adminUser, "household-1", {
        email: "missing@example.org"
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "CAREGIVER_NOT_FOUND",
      message: "Caregiver needs to sign up first."
    });

    expect(mocks.assignCaregiver).not.toHaveBeenCalled();
  });

  it("lets admins end an active caregiver assignment but rejects caregivers", async () => {
    const { unassignCaregiverFromHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    await unassignCaregiverFromHouseholdForUser(adminUser, "household-1", "user-caregiver-1");
    expect(mocks.unassignCaregiver).toHaveBeenCalledWith("household-1", "user-caregiver-1");
    await expect(unassignCaregiverFromHouseholdForUser(caregiverUser, "household-1", "user-caregiver-1")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("returns a controlled error when no active caregiver assignment exists", async () => {
    const { unassignCaregiverFromHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    mocks.unassignCaregiver.mockResolvedValueOnce(false);
    await expect(unassignCaregiverFromHouseholdForUser(adminUser, "household-1", "missing")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("updates an address with a rebuilt display value and protects admin-only fields", async () => {
    const { updateHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    await updateHouseholdForUser(adminUser, "household-1", { addressLine1: "Blk 2 New Road", unitNumber: "#02-02", postalCode: "468002" });
    expect(mocks.findDuplicateAddressExcludingHousehold).toHaveBeenCalledWith("site-bedok", "Blk 2 New Road, #02-02, 468002", "household-1");
    expect(mocks.updateHouseholdAddress).toHaveBeenCalledWith("household-1", expect.objectContaining({ displayAddress: "Blk 2 New Road, #02-02, 468002" }));
    await expect(updateHouseholdForUser(caregiverUser, "household-1", { addressLine1: "Blk 2 New Road" })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects duplicate edited addresses while allowing an unchanged address", async () => {
    const { updateHouseholdForUser } = await import("@/modules/households/services/household-management.service");
    mocks.findDuplicateAddressExcludingHousehold.mockResolvedValueOnce({ id: "household-2" });
    await expect(updateHouseholdForUser(adminUser, "household-1", { addressLine1: "Blk 9 Duplicate Road" })).rejects.toMatchObject({ statusCode: 409 });
    await expect(updateHouseholdForUser(adminUser, "household-1", { addressLine1: "Blk 18 Bedok South Road", unitNumber: "#05-123", postalCode: "460018" })).resolves.toBeDefined();
  });
});
