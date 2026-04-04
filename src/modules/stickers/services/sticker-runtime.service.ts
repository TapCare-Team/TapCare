import type { Household } from "@/modules/households/domain/household";
import type { Sticker } from "@/modules/stickers/domain/sticker";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import type { DestinationType, FailureReason, InteractionEventType } from "@/modules/analytics/domain/analytics";
import { logger } from "@/lib/logging/logger";
import { isDatabaseConfigured } from "@/lib/db/database-mode";

const mockHouseholdsRepository = new MockHouseholdsRepository();
const prismaHouseholdsRepository = new PrismaHouseholdsRepository();
const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();

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

async function getHouseholdByStickerPublicCode(publicCode: string) {
  if (!isDatabaseConfigured()) {
    return mockHouseholdsRepository.getByStickerPublicCode(publicCode);
  }

  try {
    return await prismaHouseholdsRepository.getByStickerPublicCode(publicCode);
  } catch (error) {
    logger.warn("public_sticker_read_fallback_to_mock", {
      publicCode,
      error: error instanceof Error ? error.message : "unknown"
    });
    return mockHouseholdsRepository.getByStickerPublicCode(publicCode);
  }
}

async function persistRuntimeEvent(params: {
  household?: Household;
  sticker?: Sticker;
  publicCode: string;
  eventType: InteractionEventType;
  outcome: "SUCCESS" | "FAILED";
  destinationType?: DestinationType;
  failureReason?: FailureReason;
}) {
  const event = {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    siteId: params.household?.siteId ?? "unknown-site",
    householdId: params.household?.id,
    stickerId: params.sticker?.id,
    publicCode: params.publicCode,
    stickerType: params.sticker?.stickerType,
    runtimeMode: params.sticker?.runtimeMode,
    eventType: params.eventType,
    outcome: params.outcome,
    destinationType: params.destinationType,
    failureReason: params.failureReason
  } as const;

  if (!isDatabaseConfigured()) {
    return mockAnalyticsRepository.createEvent(event);
  }

  try {
    return await prismaAnalyticsRepository.createEvent(event);
  } catch (error) {
    logger.warn("runtime_event_persist_fallback_to_mock", {
      publicCode: params.publicCode,
      eventType: params.eventType,
      error: error instanceof Error ? error.message : "unknown"
    });
    return mockAnalyticsRepository.createEvent(event);
  }
}

export async function resolvePublicSticker(publicCode: string): Promise<RuntimeResolution> {
  const normalized = normalizePublicCode(publicCode);
  const household = await getHouseholdByStickerPublicCode(normalized);

  if (!household) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "NOT_FOUND" });
    await persistRuntimeEvent({
      publicCode: normalized,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "INVALID_CODE"
    });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  const sticker = household.stickers.find((item) => item.publicCode === normalized);
  if (!sticker) {
    logger.warn("sticker_opened", { publicCode: normalized, outcome: "NOT_FOUND" });
    await persistRuntimeEvent({
      publicCode: normalized,
      household,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "INVALID_CODE"
    });
    return { kind: "NOT_FOUND", publicCode: normalized };
  }

  if (sticker.status !== "ACTIVE") {
    logger.warn("sticker_opened", {
      publicCode: normalized,
      householdId: household.id,
      stickerId: sticker.id,
      outcome: "DISABLED"
    });
    await persistRuntimeEvent({
      publicCode: normalized,
      household,
      sticker,
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "DISABLED_STICKER"
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
  await persistRuntimeEvent({
    publicCode: normalized,
    household,
    sticker,
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  });

  if (sticker.runtimeMode === "DIRECT_REDIRECT" && sticker.destination) {
    logger.info("redirect_issued", {
      publicCode: normalized,
      householdId: household.id,
      stickerId: sticker.id,
      destinationType: sticker.destination.type
    });
    await persistRuntimeEvent({
      publicCode: normalized,
      household,
      sticker,
      eventType: "REDIRECT_ISSUED",
      outcome: "SUCCESS",
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

export async function recordPageRendered(resolution: Extract<RuntimeResolution, { kind: "RENDER_PAGE" }>) {
  logger.info("page_rendered", {
    publicCode: resolution.publicCode,
    householdId: resolution.household.id,
    stickerId: resolution.sticker.id,
    pageType: resolution.sticker.page?.pageType
  });

  await persistRuntimeEvent({
    publicCode: resolution.publicCode,
    household: resolution.household,
    sticker: resolution.sticker,
    eventType: "PAGE_RENDERED",
    outcome: "SUCCESS"
  });
}
