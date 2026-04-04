import test from "node:test";
import assert from "node:assert/strict";

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(a, b) {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function withinDays(eventDate, now, windowDays) {
  return daysBetween(now, eventDate) < windowDays;
}

function uniqueDayCount(events) {
  return new Set(events.map((event) => event.occurredAt.slice(0, 10))).size;
}

function openedByType(events, stickerType) {
  return events.filter(
    (event) =>
      event.stickerType === stickerType &&
      event.eventType === "STICKER_OPENED" &&
      event.outcome === "SUCCESS"
  );
}

function deriveFollowUpSignals({ households, events, now = new Date("2025-04-04T09:00:00.000Z") }) {
  const signals = [];

  for (const household of households) {
    const householdEvents = events.filter((event) => event.householdId === household.id);
    const recentEvents = householdEvents.filter((event) => withinDays(new Date(event.occurredAt), now, 7));

    if (openedByType(recentEvents, "EMERGENCY_CONTACT").length >= 3) {
      signals.push({ signalType: "REPEATED_EMERGENCY_USAGE" });
    }

    const baselineEvents = householdEvents.filter((event) => {
      const age = daysBetween(now, new Date(event.occurredAt));
      return event.eventType === "STICKER_OPENED" && age >= 10 && age < 40 && event.outcome === "SUCCESS";
    });
    const baselineActiveDays = uniqueDayCount(baselineEvents);
    const inactiveRecentEvents = householdEvents.filter(
      (event) =>
        event.eventType === "STICKER_OPENED" &&
        event.outcome === "SUCCESS" &&
        withinDays(new Date(event.occurredAt), now, 10)
    );

    if (baselineActiveDays >= 8 && inactiveRecentEvents.length === 0 && household.lastActiveAt) {
      signals.push({ signalType: "SUDDEN_INACTIVITY" });
    }

    const hasActiveCriticalSticker = household.stickers.some(
      (sticker) =>
        sticker.status === "ACTIVE" &&
        (sticker.stickerType === "EMERGENCY_CONTACT" || sticker.stickerType === "HELP_PROFILE")
    );

    if (!hasActiveCriticalSticker) {
      signals.push({ signalType: "NO_ACTIVE_CRITICAL_STICKER" });
    }
  }

  return signals;
}

const mockHouseholds = [
  {
    id: "household-1",
    lastActiveAt: "2025-04-03T10:00:00.000Z",
    stickers: [{ stickerType: "EMERGENCY_CONTACT", status: "ACTIVE" }]
  },
  {
    id: "household-2",
    lastActiveAt: "2025-03-22T08:00:00.000Z",
    stickers: [{ stickerType: "EMERGENCY_CONTACT", status: "DISABLED" }]
  }
];

const mockInteractionEvents = [
  {
    householdId: "household-1",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-30T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-1",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-04-01T08:15:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-1",
    stickerType: "EMERGENCY_CONTACT",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-04-03T10:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-05T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-08T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-12T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-14T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-16T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-18T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-20T08:00:00.000Z",
    outcome: "SUCCESS"
  },
  {
    householdId: "household-2",
    stickerType: "CURATED_RESOURCES",
    eventType: "STICKER_OPENED",
    occurredAt: "2025-03-21T08:00:00.000Z",
    outcome: "SUCCESS"
  }
];

test("creates repeated emergency usage signal from simple sticker-open events", () => {
  const signals = deriveFollowUpSignals({
    households: [mockHouseholds[0]],
    events: mockInteractionEvents.filter((event) => event.householdId === "household-1")
  });

  assert.equal(signals.some((signal) => signal.signalType === "REPEATED_EMERGENCY_USAGE"), true);
});

test("creates inactivity signal only when there is a baseline and no recent sticker activity", () => {
  const signals = deriveFollowUpSignals({
    households: [mockHouseholds[1]],
    events: mockInteractionEvents.filter((event) => event.householdId === "household-2")
  });

  assert.equal(signals.some((signal) => signal.signalType === "SUDDEN_INACTIVITY"), true);
});

test("creates no-active-critical-sticker signal when critical stickers are disabled", () => {
  const signals = deriveFollowUpSignals({
    households: [mockHouseholds[1]],
    events: mockInteractionEvents.filter((event) => event.householdId === "household-2")
  });

  assert.equal(signals.some((signal) => signal.signalType === "NO_ACTIVE_CRITICAL_STICKER"), true);
});
