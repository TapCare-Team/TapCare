import type { Household, Sticker } from "@/modules/households/domain/household";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { logger } from "@/lib/logging/logger";

const householdsRepository = new MockHouseholdsRepository();

export type RuntimeResolution =
  | {
      kind: "NOT_FOUND";
      publicCode: string;
    }
  | {
      kind: "DISABLED";
      publicCode: string;
      household: Household;
      sticker: Sticker;
    }
  | {
      kind: "DIRECT_REDIRECT";
      publicCode: string;
      household: Household;
      sticker: Sticker;
      destinationUrl: string;
    }
  | {
      kind: "RENDER_PAGE";
      publicCode: string;
      household: Household;
      sticker: Sticker;
    };

function normalizePublicCode(publicCode: string) {
  return publicCode.trim().toUpperCase();
}

export async function resolvePublicSticker(publicCode: string): Promise<RuntimeResolution> {
  const normalized = normalizePublicCode(publicCode);
  const household = await householdsRepository.getByStickerPublicCode(normalized);

  if (!household) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "NOT_FOUND" });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  const sticker = household.stickers.find((item) => item.publicCode === normalized);
  if (!sticker) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "NOT_FOUND" });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  if (sticker.status !== "ACTIVE") {
    logger.warn("sticker_opened", {
      publicCode: normalized,
      householdId: household.id,
      stickerId: sticker.id,
      outcome: "DISABLED"
    });
    return { kind: "DISABLED", publicCode: normalized, household, sticker };
  }

  logger.info("sticker_opened", {
    publicCode: normalized,
    householdId: household.id,
    stickerId: sticker.id,
    runtimeMode: sticker.runtimeMode,
    stickerType: sticker.stickerType
  });

  if (sticker.runtimeMode === "DIRECT_REDIRECT" && sticker.destination) {
    logger.info("redirect_issued", {
      publicCode: normalized,
      householdId: household.id,
      stickerId: sticker.id,
      destinationType: sticker.destination.type
    });
    return {
      kind: "DIRECT_REDIRECT",
      publicCode: normalized,
      household,
      sticker,
      destinationUrl: sticker.destination.value
    };
  }

  return {
    kind: "RENDER_PAGE",
    publicCode: normalized,
    household,
    sticker
  };
}
