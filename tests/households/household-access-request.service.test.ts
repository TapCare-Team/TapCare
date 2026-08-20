import { beforeEach, describe, expect, it, vi } from "vitest";
import { householdMessages } from "@/modules/shared/messages";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  listAllSites: vi.fn(),
  createRequest: vi.fn(),
  listByRequester: vi.fn(),
  listPending: vi.fn(),
  getPendingById: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
  findDuplicateAddress: vi.fn(),
  createHousehold: vi.fn(),
  assignCaregiver: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured
}));

vi.mock("@/modules/households/repositories/prisma-household-access-requests.repository", () => ({
  PrismaHouseholdAccessRequestsRepository: class {
    create = mocks.createRequest;
    listByRequester = mocks.listByRequester;
    listPending = mocks.listPending;
    getPendingById = mocks.getPendingById;
    approve = mocks.approveRequest;
    reject = mocks.rejectRequest;
  }
}));

vi.mock("@/modules/households/repositories/prisma-households.repository", () => ({
  PrismaHouseholdsRepository: class {
    findDuplicateAddress = mocks.findDuplicateAddress;
    create = mocks.createHousehold;
    assignCaregiver = mocks.assignCaregiver;
  }
}));

vi.mock("@/modules/households/repositories/prisma-sites.repository", () => ({
  PrismaSitesRepository: class {
    listAll = mocks.listAllSites;
  }
}));

const caregiverUser = {
  id: "user-caregiver",
  displayName: "Caregiver Maya",
  role: "CAREGIVER" as const,
  siteIds: [],
  householdIds: ["household-1"]
};

const adminUser = {
  id: "user-admin",
  displayName: "Admin Junny",
  role: "ADMIN" as const,
  siteIds: [],
  householdIds: []
};

describe("household-access-request.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.listAllSites.mockResolvedValue([
      { id: "site-bedok", code: "SGO-BEDOK", name: "SGO Bedok", region: "East" }
    ]);
    mocks.createRequest.mockImplementation(async (input: { requesterId: string; displayAddress: string }) => ({
      id: `request-${mocks.createRequest.mock.calls.length}`,
      requesterId: input.requesterId,
      requesterName: "Caregiver Maya",
      requesterEmail: "maya.lim@example.org",
      siteId: "site-bedok",
      siteName: "SGO Bedok",
      status: "PENDING",
      addressLine1: "Blk 18 Bedok South Road",
      displayAddress: input.displayAddress,
      createdAt: "2026-08-04T00:00:00.000Z"
    }));
  });

  it("allows a caregiver to submit multiple household access requests", async () => {
    const { createHouseholdAccessRequestForCaregiver } = await import(
      "@/modules/households/services/household-access-request.service"
    );

    const firstRequest = await createHouseholdAccessRequestForCaregiver(caregiverUser, {
      siteId: "site-bedok",
      addressLine1: "Blk 18 Bedok South Road",
      unitNumber: "#05-123",
      postalCode: "460018"
    });
    const secondRequest = await createHouseholdAccessRequestForCaregiver(caregiverUser, {
      siteId: "site-bedok",
      addressLine1: "Blk 22 Bedok South Road",
      unitNumber: "#09-321",
      postalCode: "460022"
    });

    expect(mocks.createRequest).toHaveBeenCalledTimes(2);
    expect(firstRequest.id).toBe("request-1");
    expect(secondRequest.id).toBe("request-2");
  });

  it("explains when a non-caregiver account tries to request household access", async () => {
    const { createHouseholdAccessRequestForCaregiver } = await import(
      "@/modules/households/services/household-access-request.service"
    );

    await expect(
      createHouseholdAccessRequestForCaregiver(adminUser, {
        siteId: "site-bedok",
        addressLine1: "Blk 18 Bedok South Road",
        unitNumber: "#05-123",
        postalCode: "460018"
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: householdMessages.caregiverRequestsOnly
    });
  });

  it("rejects caregivers from the global admin request queue and guessed request IDs", async () => {
    const {
      approveHouseholdAccessRequestForAdmin,
      listPendingHouseholdAccessRequestsForAdmin,
      rejectHouseholdAccessRequestForAdmin
    } = await import("@/modules/households/services/household-access-request.service");

    await expect(listPendingHouseholdAccessRequestsForAdmin(caregiverUser)).rejects.toMatchObject({ statusCode: 403 });
    await expect(approveHouseholdAccessRequestForAdmin(caregiverUser, "guessed-request-id")).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(rejectHouseholdAccessRequestForAdmin(caregiverUser, "guessed-request-id")).rejects.toMatchObject({
      statusCode: 403
    });

    expect(mocks.listPending).not.toHaveBeenCalled();
    expect(mocks.getPendingById).not.toHaveBeenCalled();
    expect(mocks.approveRequest).not.toHaveBeenCalled();
    expect(mocks.rejectRequest).not.toHaveBeenCalled();
  });
});
