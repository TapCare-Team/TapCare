import { describe, expect, it } from "vitest";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import {
  buildFailurePatterns,
  buildFeatureAdoption,
  buildIngestionHealth
} from "@/modules/analytics/services/admin-analytics.service";

const events: InteractionEvent[] = [
  {
    id: "event-1",
    occurredAt: "2026-06-24T01:00:00.000Z",
    siteId: "site-bedok",
    householdId: "household-1",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "STICKER_OPENED",
    outcome: "SUCCESS"
  },
  {
    id: "event-2",
    occurredAt: "2026-06-24T01:00:01.000Z",
    siteId: "site-bedok",
    householdId: "household-1",
    stickerType: "EMERGENCY_CONTACT",
    runtimeMode: "DIRECT_REDIRECT",
    eventType: "REDIRECT_ISSUED",
    outcome: "SUCCESS",
    destinationType: "PHONE"
  },
  {
    id: "event-3",
    occurredAt: "2026-06-23T12:00:00.000Z",
    siteId: "site-bedok",
    householdId: "household-2",
    stickerType: "CHECKLIST_REMINDER",
    runtimeMode: "RENDER_PAGE",
    eventType: "STICKER_OPENED",
    outcome: "FAILED",
    failureReason: "MISSING_CONFIGURATION"
  }
];

describe("admin analytics summaries", () => {
  it("builds privacy-safe ingestion health counts", () => {
    const health = buildIngestionHealth(events, new Date("2026-06-24T02:00:00.000Z"));

    expect(health).toMatchObject({
      totalEvents: 3,
      eventsLast24h: 3,
      lastEventAt: "2026-06-24T01:00:01.000Z",
      failedEvents: 1,
      failureRate: 0.33
    });
    expect(health.eventCounts.STICKER_OPENED).toBe(2);
    expect(health.eventCounts.REDIRECT_ISSUED).toBe(1);
  });

  it("groups failures without exposing message or call contents", () => {
    const patterns = buildFailurePatterns(events);

    expect(patterns.totalFailures).toBe(1);
    expect(patterns.byReason).toEqual({ MISSING_CONFIGURATION: 1 });
    expect(patterns.recentFailures).toEqual([
      {
        occurredAt: "2026-06-23T12:00:00.000Z",
        siteId: "site-bedok",
        householdId: "household-2",
        stickerType: "CHECKLIST_REMINDER",
        eventType: "STICKER_OPENED",
        failureReason: "MISSING_CONFIGURATION"
      }
    ]);
  });

  it("builds feature adoption snapshots with labels", () => {
    const adoption = buildFeatureAdoption(events);
    const emergencyContact = adoption.find((snapshot) => snapshot.stickerType === "EMERGENCY_CONTACT");

    expect(emergencyContact).toMatchObject({
      label: "Emergency contact",
      totalEvents: 1,
      successfulEvents: 1,
      uniqueHouseholds: 1
    });
  });
});
