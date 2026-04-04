import type { FeatureSnapshot, InteractionEvent, StickerType } from "@/modules/analytics/domain/analytics";
import { stickerTypes } from "@/modules/analytics/domain/analytics";

export function buildFeatureSnapshots(events: InteractionEvent[]): FeatureSnapshot[] {
  return stickerTypes.map((stickerType) => {
    const stickerEvents = events.filter(
      (event) => event.stickerType === stickerType && event.eventType === "STICKER_OPENED"
    );
    const successful = stickerEvents.filter((event) => event.outcome === "SUCCESS");
    const households = successful.map((event) => event.householdId).filter(Boolean) as string[];
    const perHousehold = households.reduce<Record<string, number>>((acc, householdId) => {
      acc[householdId] = (acc[householdId] ?? 0) + 1;
      return acc;
    }, {});

    return {
      stickerType,
      totalEvents: stickerEvents.length,
      successfulEvents: successful.length,
      uniqueHouseholds: new Set(households).size,
      repeatHouseholds: Object.values(perHousehold).filter((count) => count > 1).length,
      failureRate:
        stickerEvents.length === 0
          ? 0
          : Number(
              (
                stickerEvents.filter((event) => event.outcome === "FAILED").length / stickerEvents.length
              ).toFixed(2)
            )
    };
  });
}

export function labelForStickerType(stickerType: StickerType) {
  return {
    EMERGENCY_CONTACT: "Emergency contact",
    FREQUENT_CONTACT: "Frequent contact",
    CHECKLIST_REMINDER: "Checklist reminder",
    HELP_PROFILE: "Help profile",
    CURATED_RESOURCES: "Curated resources"
  }[stickerType];
}
