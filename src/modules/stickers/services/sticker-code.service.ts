import { randomUUID } from "node:crypto";
import type { StickerType } from "@/modules/analytics/domain/analytics";
import { PrismaStickersRepository } from "@/modules/stickers/repositories/prisma-stickers.repository";
import { setupMessages } from "@/modules/shared/messages";

const stickersRepository = new PrismaStickersRepository();

const PREFIX_BY_TYPE: Record<StickerType, string> = {
  EMERGENCY_CONTACT: "EC",
  FREQUENT_CONTACT: "FC",
  CHECKLIST_REMINDER: "CL",
  HELP_PROFILE: "HP",
  CURATED_RESOURCES: "RS"
};

export function buildDisplayCodeCandidate(stickerType: StickerType, serialNumber: number) {
  return `${PREFIX_BY_TYPE[stickerType]}-${serialNumber.toString().padStart(4, "0")}`;
}

export function nextDisplayCodeFromExisting(stickerType: StickerType, existingDisplayCodes: string[]) {
  const prefix = `${PREFIX_BY_TYPE[stickerType]}-`;
  const maxSerial = existingDisplayCodes.reduce((currentMax, displayCode) => {
    if (!displayCode.startsWith(prefix)) {
      return currentMax;
    }

    const parsed = Number.parseInt(displayCode.slice(prefix.length), 10);
    if (!Number.isFinite(parsed)) {
      return currentMax;
    }

    return Math.max(currentMax, parsed);
  }, 0);

  return buildDisplayCodeCandidate(stickerType, maxSerial + 1);
}

export async function generateDisplayCode(householdId: string, stickerType: StickerType) {
  const existingDisplayCodes = await stickersRepository.listDisplayCodesByHouseholdAndStickerType(
    householdId,
    stickerType
  );

  return nextDisplayCodeFromExisting(stickerType, existingDisplayCodes);
}

export function generatePublicCode() {
  return randomUUID();
}
