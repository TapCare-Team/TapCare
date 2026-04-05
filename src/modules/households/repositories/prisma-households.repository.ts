import { prisma } from "@/lib/db/prisma";
import { mapPrismaHousehold } from "@/modules/households/repositories/prisma-mappers";

const householdInclude = {
  site: true,
  seniors: true,
  assignments: true,
  stickers: {
    include: {
      destinationConfig: true,
      pageConfig: true
    }
  }
} as const;

export class PrismaHouseholdsRepository {
  async listBySiteIds(siteIds: string[]) {
    const households = await prisma.household.findMany({
      where: { siteId: { in: siteIds }, status: "ACTIVE" },
      include: householdInclude,
      orderBy: [{ siteId: "asc" }, { displayAddress: "asc" }]
    });

    return households.map(mapPrismaHousehold);
  }

  async listBySite(siteId: string) {
    const households = await prisma.household.findMany({
      where: { siteId, status: "ACTIVE" },
      include: householdInclude,
      orderBy: { displayAddress: "asc" }
    });

    return households.map(mapPrismaHousehold);
  }

  async listByIds(householdIds: string[]) {
    const households = await prisma.household.findMany({
      where: { id: { in: householdIds } },
      include: householdInclude,
      orderBy: { displayAddress: "asc" }
    });

    return households.map(mapPrismaHousehold);
  }

  async getById(householdId: string) {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: householdInclude
    });

    return household ? mapPrismaHousehold(household) : null;
  }

  async getByStickerPublicCode(publicCode: string) {
    const household = await prisma.household.findFirst({
      where: { stickers: { some: { publicCode } } },
      include: householdInclude
    });

    return household ? mapPrismaHousehold(household) : null;
  }
}
