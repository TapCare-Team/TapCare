import { mockHouseholds } from "@/lib/mock-data";
import type { Household } from "@/modules/households/domain/household";

export class MockHouseholdsRepository {
  async listBySiteIds(siteIds: string[]) {
    return mockHouseholds.filter((household) => siteIds.includes(household.siteId));
  }

  async listBySite(siteId: string) {
    return mockHouseholds.filter((household) => household.siteId === siteId);
  }

  async listByIds(householdIds: string[]) {
    return mockHouseholds.filter((household) => householdIds.includes(household.id));
  }

  async getById(householdId: string) {
    return mockHouseholds.find((household) => household.id === householdId) ?? null;
  }

  async getByStickerPublicCode(publicCode: string) {
    return (
      mockHouseholds.find((household) =>
        household.stickers.some((sticker) => sticker.publicCode === publicCode)
      ) ?? null
    );
  }

  async findDuplicateAddress(siteId: string, displayAddress: string) {
    return (
      mockHouseholds.find(
        (household) =>
          household.siteId === siteId && household.displayAddress.toLowerCase() === displayAddress.toLowerCase()
      ) ?? null
    );
  }

  async create(_input: {
    siteId: string;
    addressLine1: string;
    addressLine2?: string;
    unitNumber?: string;
    postalCode?: string;
    displayAddress: string;
    seniorDisplayName?: string;
  }): Promise<Household> {
    throw new Error("Mock household creation is not supported");
  }
}
