import { mockHouseholds } from "@/lib/mock-data";

export class MockHouseholdsRepository {
  async listBySite(siteId: string) {
    return mockHouseholds.filter((household) => household.siteId === siteId);
  }

  async listByIds(householdIds: string[]) {
    return mockHouseholds.filter((household) => householdIds.includes(household.id));
  }

  async getById(householdId: string) {
    return mockHouseholds.find((household) => household.id === householdId) ?? null;
  }
}
