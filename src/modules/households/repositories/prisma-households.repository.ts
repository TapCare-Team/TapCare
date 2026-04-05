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

  async findDuplicateAddress(siteId: string, displayAddress: string) {
    const household = await prisma.household.findFirst({
      where: {
        siteId,
        status: "ACTIVE",
        displayAddress: {
          equals: displayAddress,
          mode: "insensitive"
        }
      },
      include: householdInclude
    });

    return household ? mapPrismaHousehold(household) : null;
  }

  async create(input: {
    siteId: string;
    addressLine1: string;
    addressLine2?: string;
    unitNumber?: string;
    postalCode?: string;
    displayAddress: string;
    seniorDisplayName?: string;
  }) {
    const household = await prisma.household.create({
      data: {
        siteId: input.siteId,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        unitNumber: input.unitNumber,
        postalCode: input.postalCode,
        displayAddress: input.displayAddress,
        seniors: input.seniorDisplayName
          ? {
              create: {
                displayAlias: input.seniorDisplayName
              }
            }
          : undefined
      },
      include: householdInclude
    });

    return mapPrismaHousehold(household);
  }
}
