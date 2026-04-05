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

export async function generateDisplayCode(householdId: string, stickerType: StickerType) {
  const existingCount = await stickersRepository.countByHouseholdAndStickerType(householdId, stickerType);

  for (let offset = 1; offset <= 25; offset += 1) {
    const candidate = buildDisplayCodeCandidate(stickerType, existingCount + offset);
    const exists = await stickersRepository.existsByDisplayCode(householdId, candidate);

    if (!exists) {
      return candidate;
    }
  }

  throw new Error(setupMessages.uniqueDisplayCodeFailed);
}

export function generatePublicCode() {
  return randomUUID();
}
