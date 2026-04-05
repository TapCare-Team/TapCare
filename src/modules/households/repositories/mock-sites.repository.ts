import { mockHouseholds } from "@/lib/mock-data";
import type { SiteSummary } from "@/modules/households/repositories/prisma-sites.repository";

const mockSites: SiteSummary[] = Array.from(
  new Map(
    mockHouseholds.map((household) => [
      household.siteId,
      {
        id: household.siteId,
        code: household.siteName.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-"),
        name: household.siteName
      }
    ])
  ).values()
);

export class MockSitesRepository {
  async listByIds(siteIds: string[]): Promise<SiteSummary[]> {
    return mockSites.filter((site) => siteIds.includes(site.id));
  }

  async listAll(): Promise<SiteSummary[]> {
    return mockSites;
  }
}
