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
  },
  {
    id: "event-4",
    occurredAt: "2026-06-24T01:30:00.000Z",
    siteId: "unknown-site",
    eventType: "STICKER_OPENED",
    outcome: "FAILED",
    failureReason: "INVALID_CODE"
  }
];

describe("admin analytics summaries", () => {
  it("builds privacy-safe ingestion health counts", () => {
    const health = buildIngestionHealth(events, new Date("2026-06-24T02:00:00.000Z"));

    expect(health).toMatchObject({
      totalEvents: 4,
      eventsLast24h: 4,
      eventsLast48h: 4,
      lastEventAt: "2026-06-24T01:30:00.000Z",
      failedEvents: 2,
      failureRate: 0.5
    });
    expect(health.eventCounts.STICKER_OPENED).toBe(3);
    expect(health.eventCounts.REDIRECT_ISSUED).toBe(1);
  });

  it("groups failures without exposing message or call contents", () => {
    const patterns = buildFailurePatterns(events);

    expect(patterns.totalFailures).toBe(2);
    expect(patterns.byReason).toEqual({ INVALID_CODE: 1, MISSING_CONFIGURATION: 1 });
    expect(patterns.recentFailures).toEqual([
      {
        occurredAt: "2026-06-24T01:30:00.000Z",
        siteId: "unknown-site",
        householdId: null,
        stickerType: null,
        eventType: "STICKER_OPENED",
        failureReason: "INVALID_CODE"
      },
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
    const checklist = adoption.find((snapshot) => snapshot.stickerType === "CHECKLIST_REMINDER");

    expect(emergencyContact).toMatchObject({
      label: "Emergency contact",
      totalEvents: 1,
      successfulEvents: 1,
      failedEvents: 0,
      uniqueHouseholds: 1
    });
    expect(checklist).toMatchObject({
      label: "Checklist reminder",
      totalEvents: 1,
      successfulEvents: 0,
      failedEvents: 1,
      failureRate: 1
    });
  });
});
