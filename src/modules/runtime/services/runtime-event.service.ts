import { logger } from "@/lib/logging/logger";
import { getPublicRuntimeRepositories } from "@/modules/runtime/repositories/public-runtime.repository-provider";
import type { RuntimeEventInput } from "@/modules/runtime/domain/public-runtime";

export async function recordRuntimeEvent(params: RuntimeEventInput) {
  const { eventsRepository } = getPublicRuntimeRepositories();

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
    failureReason: params.failureReason,
    metadata: params.metadata
  } as const;

  try {
    await eventsRepository.createEvent(event);
  } catch (error) {
    logger.warn("runtime_event_write_failed", {
      publicCode: params.publicCode,
      eventType: params.eventType,
      error: error instanceof Error ? error.message : "unknown"
    });
  }

  return event;
}
