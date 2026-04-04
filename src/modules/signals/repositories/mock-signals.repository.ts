import { mockDerivedSignals } from "@/lib/mock-data";

export class MockSignalsRepository {
  async listBySite(siteId: string) {
    return mockDerivedSignals.filter((signal) => signal.siteId === siteId);
  }

  async listByHouseholdIds(householdIds: string[]) {
    return mockDerivedSignals.filter((signal) => householdIds.includes(signal.householdId));
  }
}
