import type { Sticker } from "@/modules/stickers/domain/sticker";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { PrismaStickersRepository } from "@/modules/stickers/repositories/prisma-stickers.repository";
import { isDatabaseConfigured } from "@/lib/db/database-mode";

type CreateStickerInput = Omit<Sticker, "id"> & { householdId: string };

const householdsRepository = new PrismaHouseholdsRepository();
const stickersRepository = new PrismaStickersRepository();

export async function listHouseholdStickers(householdId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for setup APIs");
  }

  return stickersRepository.listByHouseholdId(householdId);
}

export async function createSticker(input: CreateStickerInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for setup APIs");
  }

  const household = await householdsRepository.getById(input.householdId);
  if (!household) {
    throw new Error("Household not found");
  }

  return stickersRepository.create({
    ...input,
    siteId: household.siteId
  });
}

export async function updateSticker(stickerId: string, patch: Partial<Sticker>) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for setup APIs");
  }

  return stickersRepository.update(stickerId, patch);
}

export async function assignStickerToHousehold(stickerId: string, householdId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for setup APIs");
  }

  const household = await householdsRepository.getById(householdId);
  if (!household) {
    throw new Error("Household not found");
  }

  return stickersRepository.assignHousehold(stickerId, householdId, household.siteId);
}

export async function getStickerScope(stickerId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for setup APIs");
  }

  return stickersRepository.getScopeById(stickerId);
}
