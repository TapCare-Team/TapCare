import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  listEventsByHouseholdIds: vi.fn()
}));

vi.mock("@/modules/households/repositories/household-analytics.repository-provider", () => ({
  getHouseholdAnalyticsRepositories: () => ({
    householdsRepository: { getById: mocks.getById },
    eventsRepository: { listEventsByHouseholdIds: mocks.listEventsByHouseholdIds }
  })
}));

import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

describe("getHouseholdDetail authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getById.mockResolvedValue({
      id: "household-b",
      siteId: "site-b",
      displayAddress: "Household B",
      stickers: []
    });
  });

  it("does not expose an unassigned household or load its events when a caregiver guesses its ID", async () => {
    const caregiverA = {
      id: "caregiver-a",
      displayName: "Caregiver A",
      role: "CAREGIVER" as const,
      siteIds: [],
      householdIds: ["household-a"]
    };

    await expect(getHouseholdDetail(caregiverA, "household-b")).resolves.toBeNull();
    expect(mocks.getById).toHaveBeenCalledWith("household-b");
    expect(mocks.listEventsByHouseholdIds).not.toHaveBeenCalled();
  });
});
