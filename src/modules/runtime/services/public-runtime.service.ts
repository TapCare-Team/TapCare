import { logger } from "@/lib/logging/logger";
import type { PublicRuntimeResolution, RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { getPublicRuntimeRepositories } from "@/modules/runtime/repositories/public-runtime.repository-provider";
import { recordRuntimeEvent } from "@/modules/runtime/services/runtime-event.service";

function normalizePublicCode(publicCode: string) {
  return publicCode.trim().toLowerCase();
}

function isValidPublicCode(publicCode: string) {
  return /^[a-z0-9][a-z0-9-]{5,79}$/.test(publicCode);
}

function logStickerOpened(record: RuntimeRecord) {
  logger.info("sticker_opened", {
    publicCode: record.sticker.publicCode,
    householdId: record.household.id,
    stickerId: record.sticker.id,
    runtimeMode: record.sticker.runtimeMode,
    stickerType: record.sticker.stickerType
  });
}

function normalizeContactDestinationUrl(destination: RuntimeRecord["sticker"]["destination"]) {
  if (!destination) {
    return null;
  }

  const value = destination.value.trim();

  if (destination.type === "PHONE") {
    const digitsOnly = value.replace(/[^\d]/g, "");

    if (value.startsWith("tel:")) {
      if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
        return value.startsWith("tel:+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;
      }

      return null;
    }

    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      return value.startsWith("+") ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;
    }

    return null;
  }

  if (destination.type === "WHATSAPP") {
    if (/^https:\/\/wa\.me\/\d{8,15}$/.test(value)) {
      return value;
    }

    const digitsOnly = value.replace(/[^\d]/g, "");
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      return `https://wa.me/${digitsOnly}`;
    }

    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export async function resolvePublicRuntime(publicCode: string): Promise<PublicRuntimeResolution> {
  const normalized = normalizePublicCode(publicCode);

  if (!isValidPublicCode(normalized)) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "INVALID_CODE_FORMAT" });
    await recordRuntimeEvent({
      publicCode: normalized,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "INVALID_CODE"
    });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  const { runtimeRepository } = getPublicRuntimeRepositories();
  const record = await runtimeRepository.getByPublicCode(normalized);

  if (!record) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "NOT_FOUND" });
    await recordRuntimeEvent({
      publicCode: normalized,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "INVALID_CODE"
    });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  if (record.sticker.status !== "ACTIVE") {
    logger.warn("sticker_opened", {
      publicCode: normalized,
      householdId: record.household.id,
      stickerId: record.sticker.id,
      outcome: "DISABLED"
    });
    await recordRuntimeEvent({
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "DISABLED_STICKER"
    });
    return {
      kind: "DISABLED",
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker
    };
  }

  logStickerOpened(record);
  await recordRuntimeEvent({
    publicCode: normalized,
    household: record.household,
    sticker: record.sticker,
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  });

  if (record.sticker.runtimeMode === "DIRECT_REDIRECT" && record.sticker.destination) {
    const destinationUrl = normalizeContactDestinationUrl(record.sticker.destination);
    if (!destinationUrl) {
      logger.warn("sticker_opened", {
        publicCode: normalized,
        householdId: record.household.id,
        stickerId: record.sticker.id,
        outcome: "INVALID_DESTINATION"
      });
      await recordRuntimeEvent({
        publicCode: normalized,
        household: record.household,
        sticker: record.sticker,
        eventType: "STICKER_OPENED",
        outcome: "FAILED",
        failureReason: "INVALID_DESTINATION"
      });
      return {
        kind: "DISABLED",
        publicCode: normalized,
        household: record.household,
        sticker: record.sticker
      };
    }

    logger.info("redirect_issued", {
      publicCode: normalized,
      householdId: record.household.id,
      stickerId: record.sticker.id,
      destinationType: record.sticker.destination.type
    });
    await recordRuntimeEvent({
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker,
      eventType: "REDIRECT_ISSUED",
      outcome: "SUCCESS",
      destinationType: record.sticker.destination.type
    });
    return {
      kind: "DIRECT_REDIRECT",
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker,
      destinationUrl
    };
  }

  if (record.sticker.runtimeMode === "RENDER_PAGE" && record.sticker.page) {
    await recordRuntimeEvent({
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker,
      eventType: "PAGE_RENDERED",
      outcome: "SUCCESS"
    });
    return {
      kind: "RENDER_PAGE",
      publicCode: normalized,
      household: record.household,
      sticker: record.sticker,
      page: record.sticker.page
    };
  }

  logger.warn("sticker_opened", {
    publicCode: normalized,
    householdId: record.household.id,
    stickerId: record.sticker.id,
    outcome: "MISSING_CONFIGURATION"
  });
  await recordRuntimeEvent({
    publicCode: normalized,
    household: record.household,
    sticker: record.sticker,
    eventType: "STICKER_OPENED",
    outcome: "FAILED",
    failureReason: "MISSING_CONFIGURATION"
  });
  return {
    kind: "DISABLED",
    publicCode: normalized,
    household: record.household,
    sticker: record.sticker
  };
}
