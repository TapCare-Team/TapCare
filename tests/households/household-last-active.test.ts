import { describe, expect, it } from "vitest";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { withDerivedLastActiveAt } from "@/modules/households/domain/household-last-active";

function household(overrides: Partial<Household> = {}): Household {
  return {
    id: "household-1",
    siteId: "site-1",
    siteName: "SGO Bedok",
    addressLine1: "12 Bedok North Street 2",
    displayAddress: "12 Bedok North Street 2 #03-145",
    seniorAliases: ["Mdm Lee"],
    caregiverIds: [],
    caregiverAssignments: [],
    stickers: [],
    ...overrides
  };
}

function event(overrides: Partial<InteractionEvent>): InteractionEvent {
  return {
    id: "event-1",
    siteId: "site-1",
    householdId: "household-1",
    occurredAt: "2025-04-04T08:00:00.000Z",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS",
    ...overrides
  };
}

describe("withDerivedLastActiveAt", () => {
  it("uses the latest sticker-open event instead of stale household lastActiveAt", () => {
    const [result] = withDerivedLastActiveAt(
      [household({ lastActiveAt: "2025-04-03T10:00:00.000Z" })],
      [
        event({ id: "event-old", occurredAt: "2025-04-03T10:00:00.000Z" }),
        event({ id: "event-new", occurredAt: "2025-04-04T08:00:00.000Z" }),
        event({ id: "event-render", occurredAt: "2025-04-05T08:00:00.000Z", eventType: "PAGE_RENDERED" })
      ]
    );

    expect(result?.lastActiveAt).toBe("2025-04-04T08:00:00.000Z");
  });

  it("keeps the stored value when there are no sticker-open events", () => {
    const [result] = withDerivedLastActiveAt(
      [household({ lastActiveAt: "2025-04-03T10:00:00.000Z" })],
      [event({ eventType: "PAGE_RENDERED", occurredAt: "2025-04-05T08:00:00.000Z" })]
    );

    expect(result?.lastActiveAt).toBe("2025-04-03T10:00:00.000Z");
  });
});
