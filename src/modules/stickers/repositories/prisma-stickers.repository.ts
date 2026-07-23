import { prisma } from "@/lib/db/prisma";
import type { Sticker } from "@/modules/stickers/domain/sticker";
import { mapPrismaSticker } from "@/modules/households/repositories/prisma-mappers";

const stickerInclude = {
  destinationConfig: true,
  pageConfig: true
} as const;

type CreateStickerInput = Omit<Sticker, "id"> & { householdId: string; siteId: string };

export class PrismaStickersRepository {
  async existsByDisplayCode(householdId: string, displayCode: string) {
    const sticker = await prisma.sticker.findFirst({
      where: { householdId, displayCode },
      select: { id: true }
    });

    return Boolean(sticker);
  }

  async listDisplayCodesByHousehold(householdId: string) {
    const stickers = await prisma.sticker.findMany({
      where: { householdId },
      select: { displayCode: true }
    });

    return stickers.map((sticker) => sticker.displayCode);
  }

  async existsByPublicCode(publicCode: string) {
    const sticker = await prisma.sticker.findUnique({
      where: { publicCode },
      select: { id: true }
    });

    return Boolean(sticker);
  }

  async getScopeById(stickerId: string) {
    return prisma.sticker.findUnique({
      where: { id: stickerId },
      select: {
        id: true,
        householdId: true,
        siteId: true
      }
    });
  }

  async listByHouseholdId(householdId: string) {
    const stickers = await prisma.sticker.findMany({
      where: { householdId },
      include: stickerInclude,
      orderBy: { createdAt: "desc" }
    });

    return stickers.map(mapPrismaSticker);
  }

  async create(input: CreateStickerInput) {
    const created = await prisma.$transaction(async (tx) => {
      const destination = input.destination
        ? await tx.destinationConfig.create({
            data: {
              destinationType: input.destination.type,
              destinationValue: input.destination.value,
              label: input.destination.label
            }
          })
        : null;

      const page = input.page
        ? await tx.pageConfig.create({
            data: {
              pageType: input.page.pageType,
              title: input.page.title,
              content: input.page.content
            }
          })
        : null;

      return tx.sticker.create({
        data: {
          displayCode: input.displayCode,
          publicCode: input.publicCode,
          householdId: input.householdId,
          siteId: input.siteId,
          name: input.name,
          isCritical: input.isCritical,
          stickerType: input.stickerType,
          runtimeMode: input.runtimeMode,
          status: input.status,
          destinationConfigId: destination?.id,
          pageConfigId: page?.id
        },
        include: stickerInclude
      });
    });

    return mapPrismaSticker(created);
  }

  async update(stickerId: string, patch: Partial<Sticker>) {
    const current = await prisma.sticker.findUnique({
      where: { id: stickerId },
      include: stickerInclude
    });

    if (!current) {
      return null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const destinationConfigIdToDelete =
        patch.runtimeMode === "RENDER_PAGE" && patch.page ? current.destinationConfigId : null;
      const pageConfigIdToDelete =
        patch.runtimeMode === "DIRECT_REDIRECT" && patch.destination ? current.pageConfigId : null;

      if (patch.destination) {
        if (current.destinationConfigId) {
          await tx.destinationConfig.update({
            where: { id: current.destinationConfigId },
            data: {
              destinationType: patch.destination.type,
              destinationValue: patch.destination.value,
              label: patch.destination.label
            }
          });
        } else {
          const destination = await tx.destinationConfig.create({
            data: {
              destinationType: patch.destination.type,
              destinationValue: patch.destination.value,
              label: patch.destination.label
            }
          });
          await tx.sticker.update({
            where: { id: stickerId },
            data: { destinationConfigId: destination.id }
          });
        }
      }

      if (patch.page) {
        if (current.pageConfigId) {
          await tx.pageConfig.update({
            where: { id: current.pageConfigId },
            data: {
              pageType: patch.page.pageType,
              title: patch.page.title,
              content: patch.page.content
            }
          });
        } else {
          const page = await tx.pageConfig.create({
            data: {
              pageType: patch.page.pageType,
              title: patch.page.title,
              content: patch.page.content
            }
          });
          await tx.sticker.update({
            where: { id: stickerId },
            data: { pageConfigId: page.id }
          });
        }
      }

      const updatedSticker = await tx.sticker.update({
        where: { id: stickerId },
        data: {
          displayCode: patch.displayCode,
          publicCode: patch.publicCode,
          name: patch.name,
          isCritical: patch.isCritical,
          stickerType: patch.stickerType,
          runtimeMode: patch.runtimeMode,
          status: patch.status,
          destinationConfigId: patch.runtimeMode === "RENDER_PAGE" && patch.page ? null : undefined,
          pageConfigId: patch.runtimeMode === "DIRECT_REDIRECT" && patch.destination ? null : undefined
        },
        include: stickerInclude
      });

      if (destinationConfigIdToDelete) {
        await tx.destinationConfig.delete({
          where: { id: destinationConfigIdToDelete }
        });
      }

      if (pageConfigIdToDelete) {
        await tx.pageConfig.delete({
          where: { id: pageConfigIdToDelete }
        });
      }

      return updatedSticker;
    });

    return mapPrismaSticker(updated);
  }

  async delete(stickerId: string) {
    const current = await prisma.sticker.findUnique({
      where: { id: stickerId },
      select: {
        id: true,
        destinationConfigId: true,
        pageConfigId: true
      }
    });

    if (!current) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      await tx.interactionEvent.updateMany({
        where: { stickerId },
        data: { stickerId: null }
      });

      await tx.sticker.delete({
        where: { id: stickerId }
      });

      if (current.destinationConfigId) {
        await tx.destinationConfig.delete({
          where: { id: current.destinationConfigId }
        });
      }

      if (current.pageConfigId) {
        await tx.pageConfig.delete({
          where: { id: current.pageConfigId }
        });
      }
    });

    return true;
  }

  async assignHousehold(stickerId: string, householdId: string, siteId: string) {
    const updated = await prisma.sticker.update({
      where: { id: stickerId },
      data: { householdId, siteId },
      include: stickerInclude
    });

    return mapPrismaSticker(updated);
  }
}
