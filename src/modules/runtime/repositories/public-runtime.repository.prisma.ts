import { prisma } from "@/lib/db/prisma";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { mapPrismaSticker } from "@/modules/households/repositories/prisma-mappers";

export class PrismaPublicRuntimeRepository {
  async getByPublicCode(publicCode: string): Promise<RuntimeRecord | null> {
    const sticker = await prisma.sticker.findUnique({
      where: { publicCode },
      include: {
        destinationConfig: true,
        pageConfig: true,
        household: {
          include: {
            site: true
          }
        }
      }
    });

    if (!sticker) {
      return null;
    }

    return {
      household: {
        id: sticker.household.id,
        siteId: sticker.household.siteId,
        displayAddress: sticker.household.displayAddress
      },
      sticker: mapPrismaSticker(sticker)
    };
  }
}
