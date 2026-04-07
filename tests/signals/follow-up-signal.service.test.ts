import { describe, expect, it } from "vitest";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { mockHouseholdIds } from "@/lib/mock-data";
import {
  deriveFollowUpSignals,
  isSignalActionable,
  mergePersistedSignalState
} from "@/modules/signals/services/follow-up-signal.service";

const mockHouseholds: Household[] = [
  {
    id: mockHouseholdIds.lee,
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    addressLine1: "12 Bedok North Street 2",
    displayAddress: "12 Bedok North Street 2 #03-145",
    lastActiveAt: "2025-04-03T10:00:00.000Z",
    seniorAliases: ["Mdm Lee"],
    caregiverIds: [],
    stickers: [
      {
        id: "sticker-1",
        displayCode: "EC-0001",
        publicCode: "550e8400-e29b-41d4-a716-446655440001",
        stickerType: "EMERGENCY_CONTACT",
        runtimeMode: "DIRECT_REDIRECT",
        status: "ACTIVE",
        name: "Bathroom emergency sticker",
        isCritical: true
      }
    ]
  },
  {
    id: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    siteName: "SGO Bedok",
    addressLine1: "18 Bedok South Avenue 1",
    displayAddress: "18 Bedok South Avenue 1 #06-212",
    lastActiveAt: "2025-03-22T08:00:00.000Z",
    seniorAliases: ["Mr Goh"],
    caregiverIds: [],
    stickers: [
      {
        id: "sticker-2",
        displayCode: "EC-0001",
        publicCode: "550e8400-e29b-41d4-a716-446655440002",
        stickerType: "EMERGENCY_CONTACT",
        runtimeMode: "DIRECT_REDIRECT",
        status: "DISABLED",
        name: "Emergency contact sticker",
        isCritical: true
      }
    ]
  }
];

const mockInteractionEvents: InteractionEvent[] = [
  {
    id: "event-1",
    householdId: mockHouseholdIds.lee,
    siteId: "site-sgo-bedok",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-30T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-2",
    householdId: mockHouseholdIds.lee,
    siteId: "site-sgo-bedok",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-04-01T08:15:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-3",
    householdId: mockHouseholdIds.lee,
    siteId: "site-sgo-bedok",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-04-03T10:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-4",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-05T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-5",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-08T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-6",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-12T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-7",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-14T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-8",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-16T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-9",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-18T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-10",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-20T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    id: "event-11",
    householdId: mockHouseholdIds.goh,
    siteId: "site-sgo-bedok",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-21T08:00:00.000Z",
    outcome: "SUCCESS"
  }
];

describe("deriveFollowUpSignals", () => {
  it("creates repeated emergency usage signal from production logic", () => {
    const signals = deriveFollowUpSignals({
      households: [mockHouseholds[0]],
      events: mockInteractionEvents.filter((event) => event.householdId === mockHouseholdIds.lee),
      now: new Date("2025-04-04T09:00:00.000Z")
    });

    expect(signals.some((signal) => signal.signalType === "REPEATED_EMERGENCY_USAGE")).toBe(true);
  });

  it("creates inactivity signal only when there is a baseline and no recent sticker activity", () => {
    const signals = deriveFollowUpSignals({
      households: [mockHouseholds[1]],
      events: mockInteractionEvents.filter((event) => event.householdId === mockHouseholdIds.goh),
      now: new Date("2025-04-04T09:00:00.000Z")
    });

    expect(signals.some((signal) => signal.signalType === "SUDDEN_INACTIVITY")).toBe(true);
  });

  it("creates no-active-critical-sticker signal when critical stickers are disabled", () => {
    const signals = deriveFollowUpSignals({
      households: [mockHouseholds[1]],
      events: mockInteractionEvents.filter((event) => event.householdId === mockHouseholdIds.goh),
      now: new Date("2025-04-04T09:00:00.000Z")
    });

    expect(signals.some((signal) => signal.signalType === "NO_ACTIVE_CRITICAL_STICKER")).toBe(true);
  });

  it("does not surface seeded April 2025 emergency usage as recent when evaluated much later", () => {
    const signals = deriveFollowUpSignals({
      households: [mockHouseholds[0]],
      events: mockInteractionEvents.filter((event) => event.householdId === mockHouseholdIds.lee),
      now: new Date("2025-06-01T09:00:00.000Z")
    });

    expect(signals.some((signal) => signal.signalType === "REPEATED_EMERGENCY_USAGE")).toBe(false);
  });

  it("merges persisted review state back into derived signals", () => {
    const derivedSignals = deriveFollowUpSignals({
      households: [mockHouseholds[0]],
      events: mockInteractionEvents.filter((event) => event.householdId === mockHouseholdIds.lee),
      now: new Date("2025-04-04T09:00:00.000Z")
    });

    const mergedSignals = mergePersistedSignalState(
      derivedSignals,
      [{ id: `${mockHouseholdIds.lee}-REPEATED_EMERGENCY_USAGE`, status: "REVIEWED" }],
      [
        {
          signalId: `${mockHouseholdIds.lee}-REPEATED_EMERGENCY_USAGE`,
          review: {
            status: "REVIEWED",
            reviewedAt: "2025-04-04T12:00:00.000Z",
            note: "Reviewed by officer"
          }
        }
      ]
    );

    expect(mergedSignals[0]?.status).toBe("REVIEWED");
    expect(mergedSignals[0]?.review?.note).toBe("Reviewed by officer");
  });

  it("treats future snoozed signals as non-actionable until the snooze expires", () => {
    const mergedSignals = mergePersistedSignalState(
      [
        {
          id: `${mockHouseholdIds.lee}-REPEATED_EMERGENCY_USAGE`,
          householdId: mockHouseholdIds.lee,
          siteId: "site-sgo-bedok",
          signalType: "REPEATED_EMERGENCY_USAGE",
          status: "ACTIVE",
          explanation: "Emergency contact sticker opened 3 times in 7 days.",
          firstObservedAt: "2025-03-30T08:00:00.000Z",
          lastObservedAt: "2025-04-03T10:00:00.000Z",
          evidence: { eventCount: 3, windowDays: 7 }
        }
      ],
      [{ id: `${mockHouseholdIds.lee}-REPEATED_EMERGENCY_USAGE`, status: "REVIEWED" }],
      [
        {
          signalId: `${mockHouseholdIds.lee}-REPEATED_EMERGENCY_USAGE`,
          review: {
            status: "SNOOZED",
            reviewedAt: "2025-04-04T12:00:00.000Z",
            snoozedUntil: "2025-04-10T12:00:00.000Z"
          }
        }
      ]
    );

    expect(isSignalActionable(mergedSignals[0], new Date("2025-04-05T12:00:00.000Z"))).toBe(false);
    expect(isSignalActionable(mergedSignals[0], new Date("2025-04-11T12:00:00.000Z"))).toBe(true);
  });
});
