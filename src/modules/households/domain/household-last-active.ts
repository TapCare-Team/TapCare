import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";

function latestStickerOpenedAt(events: InteractionEvent[]) {
  return events.reduce<string | undefined>((latest, event) => {
    if (event.eventType !== "STICKER_OPENED") {
      return latest;
    }

    if (!latest || new Date(event.occurredAt).getTime() > new Date(latest).getTime()) {
      return event.occurredAt;
    }

    return latest;
  }, undefined);
}

export function withDerivedLastActiveAt<T extends Household>(households: T[], events: InteractionEvent[]) {
  const latestByHouseholdId = events.reduce<Map<string, string>>((acc, event) => {
    if (!event.householdId || event.eventType !== "STICKER_OPENED") {
      return acc;
    }

    const latest = acc.get(event.householdId);
    if (!latest || new Date(event.occurredAt).getTime() > new Date(latest).getTime()) {
      acc.set(event.householdId, event.occurredAt);
    }

    return acc;
  }, new Map());

  return households.map((household) => {
    const eventLastActiveAt = latestByHouseholdId.get(household.id);
    const fallbackLastActiveAt = household.lastActiveAt
      ? latestStickerOpenedAt(
          events.filter((event) => event.householdId === household.id)
        ) ?? household.lastActiveAt
      : undefined;

    return {
      ...household,
      lastActiveAt: eventLastActiveAt ?? fallbackLastActiveAt
    };
  });
}
