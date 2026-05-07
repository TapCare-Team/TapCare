import { logger } from "@/lib/logging/logger";
import type { PublicRuntimeResolution, RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { getPublicRuntimeRepositories } from "@/modules/runtime/repositories/public-runtime.repository-provider";
import { recordRuntimeEvent } from "@/modules/runtime/services/runtime-event.service";

function normalizePublicCode(publicCode: string) {
  return publicCode.trim().toLowerCase();
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

export async function resolvePublicRuntime(publicCode: string): Promise<PublicRuntimeResolution> {
  const normalized = normalizePublicCode(publicCode);
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
      destinationUrl: record.sticker.destination.value
    };
  }

  if (record.sticker.runtimeMode === "RENDER_PAGE" && record.sticker.page) {
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

export async function recordRenderedRuntimePage(resolution: Extract<PublicRuntimeResolution, { kind: "RENDER_PAGE" }>) {
  logger.info("page_rendered", {
    publicCode: resolution.publicCode,
    householdId: resolution.household.id,
    stickerId: resolution.sticker.id,
    pageType: resolution.page.pageType
  });

  await recordRuntimeEvent({
    publicCode: resolution.publicCode,
    household: resolution.household,
    sticker: resolution.sticker,
    eventType: "PAGE_RENDERED",
    outcome: "SUCCESS"
  });
}
