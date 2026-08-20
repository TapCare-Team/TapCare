import type { SessionUser } from "@/modules/auth/domain/access";
import { canConfigureHousehold } from "@/modules/auth/services/access-control.service";
import type { Sticker } from "@/modules/stickers/domain/sticker";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { PrismaStickersRepository } from "@/modules/stickers/repositories/prisma-stickers.repository";
import { generateDisplayCode, generatePublicCode } from "@/modules/stickers/services/sticker-code.service";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import {
  ConfigurationError,
  ConflictError,
  ForbiddenError,
  NotFoundError
} from "@/modules/shared/errors";
import { setupMessages } from "@/modules/shared/messages";

type CreateStickerInput = Omit<Sticker, "id" | "displayCode" | "publicCode" | "physicalTagTestedAt"> & {
  householdId: string;
};

const householdsRepository = new PrismaHouseholdsRepository();
const stickersRepository = new PrismaStickersRepository();

function isDisplayCodeConflict(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002" &&
    "meta" in error &&
    error.meta &&
    typeof error.meta === "object" &&
    "target" in error.meta &&
    Array.isArray(error.meta.target)
  ) {
    return error.meta.target.includes("householdId") && error.meta.target.includes("displayCode");
  }

  return false;
}

export async function listHouseholdStickers(householdId: string) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  return stickersRepository.listByHouseholdId(householdId);
}

async function getManageableHousehold(user: SessionUser, householdId: string) {
  const household = await householdsRepository.getById(householdId);
  if (!household) {
    throw new NotFoundError(setupMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  if (!canConfigureHousehold(user, household.id)) {
    throw new ForbiddenError();
  }

  return household;
}

async function getManageableStickerScope(user: SessionUser, stickerId: string) {
  const scope = await getStickerScope(stickerId);
  if (!scope) {
    throw new NotFoundError(setupMessages.stickerNotFound, "STICKER_NOT_FOUND");
  }

  if (!canConfigureHousehold(user, scope.householdId)) {
    throw new ForbiddenError();
  }

  return scope;
}

export async function listHouseholdStickersForUser(user: SessionUser, householdId: string) {
  await getManageableHousehold(user, householdId);
  return listHouseholdStickers(householdId);
}

export async function createSticker(input: CreateStickerInput) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  const household = await householdsRepository.getById(input.householdId);
  if (!household) {
    throw new NotFoundError(setupMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const displayCode = await generateDisplayCode(input.householdId, input.stickerType);
    const publicCode = generatePublicCode();

    try {
      return await stickersRepository.create({
        ...input,
        displayCode,
        publicCode,
        siteId: household.siteId
      });
    } catch (error) {
      if (isDisplayCodeConflict(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new ConflictError(setupMessages.displayCodeConflict, "DISPLAY_CODE_CONFLICT");
}

export async function createStickerForUser(user: SessionUser, input: CreateStickerInput) {
  await getManageableHousehold(user, input.householdId);
  return createSticker(input);
}

export async function updateSticker(stickerId: string, patch: Partial<Sticker>) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  return stickersRepository.update(stickerId, patch);
}

export async function updateStickerForUser(user: SessionUser, stickerId: string, patch: Partial<Sticker>) {
  await getManageableStickerScope(user, stickerId);
  const sticker = await updateSticker(stickerId, patch);
  if (!sticker) {
    throw new NotFoundError(setupMessages.stickerNotFound, "STICKER_NOT_FOUND");
  }

  return sticker;
}

export async function deleteStickerForUser(user: SessionUser, stickerId: string) {
  await getManageableStickerScope(user, stickerId);

  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  const deleted = await stickersRepository.delete(stickerId);
  if (!deleted) {
    throw new NotFoundError(setupMessages.stickerNotFound, "STICKER_NOT_FOUND");
  }
}

export async function assignStickerToHousehold(stickerId: string, householdId: string) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  const household = await householdsRepository.getById(householdId);
  if (!household) {
    throw new NotFoundError(setupMessages.householdNotFound, "HOUSEHOLD_NOT_FOUND");
  }

  return stickersRepository.assignHousehold(stickerId, householdId, household.siteId);
}

export async function assignStickerToHouseholdForUser(user: SessionUser, stickerId: string, householdId: string) {
  await getManageableStickerScope(user, stickerId);
  await getManageableHousehold(user, householdId);
  return assignStickerToHousehold(stickerId, householdId);
}

export async function getStickerScope(stickerId: string) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(setupMessages.databaseUnavailable, "SETUP_DATABASE_UNAVAILABLE");
  }

  return stickersRepository.getScopeById(stickerId);
}

export async function setStickerStatusForUser(user: SessionUser, stickerId: string, status: Sticker["status"]) {
  return updateStickerForUser(user, stickerId, { status });
}

export async function markStickerPhysicalTagTestedForUser(user: SessionUser, stickerId: string) {
  await getManageableStickerScope(user, stickerId);
  return stickersRepository.setPhysicalTagTestedAt(stickerId, new Date());
}

export async function resetStickerPhysicalTagTestForUser(user: SessionUser, stickerId: string) {
  await getManageableStickerScope(user, stickerId);
  return stickersRepository.setPhysicalTagTestedAt(stickerId, null);
}
