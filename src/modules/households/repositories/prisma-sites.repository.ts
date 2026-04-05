import { prisma } from "@/lib/db/prisma";

export type SiteSummary = {
  id: string;
  code: string;
  name: string;
  region?: string;
};

export class PrismaSitesRepository {
  async listByIds(siteIds: string[]): Promise<SiteSummary[]> {
    if (siteIds.length === 0) {
      return [];
    }

    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      orderBy: { name: "asc" }
    });

    return sites.map((site) => ({
      id: site.id,
      code: site.code,
      name: site.name,
      region: site.region ?? undefined
    }));
  }

  async listAll(): Promise<SiteSummary[]> {
    const sites = await prisma.site.findMany({
      orderBy: { name: "asc" }
    });

    return sites.map((site) => ({
      id: site.id,
      code: site.code,
      name: site.name,
      region: site.region ?? undefined
    }));
  }
}
