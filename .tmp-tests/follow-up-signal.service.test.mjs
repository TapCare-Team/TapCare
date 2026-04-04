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

function makeSignal(params) {
  return {
    id: `${params.household.id}-${params.signalType}`,
    householdId: params.household.id,
    siteId: params.household.siteId,
    signalType: params.signalType,
    status: "ACTIVE",
    explanation: params.explanation,
    firstObservedAt: params.firstObservedAt,
    lastObservedAt: params.lastObservedAt,
    evidence: params.evidence
  };
}

function byTemplate(events, templateKey) {
  return events.filter((event) => event.templateKey === templateKey && event.outcome === "success");
}

function deriveFollowUpSignals({ households, events, now = new Date("2025-04-04T09:00:00.000Z") }) {
  const signals = [];

  for (const household of households) {
    const householdEvents = events.filter((event) => event.householdId === household.id);
    const recentEvents = householdEvents.filter((event) => withinDays(new Date(event.occurredAt), now, 7));
    const recentByTemplate = (templateKey) => byTemplate(recentEvents, templateKey);

    const emergencyEvents = recentByTemplate("emergency_contact");
    if (emergencyEvents.length >= 3) {
      signals.push(
        makeSignal({
          household,
          signalType: "REPEATED_EMERGENCY_USAGE",
          explanation: `Emergency contact sticker opened ${emergencyEvents.length} times in 7 days.`,
          firstObservedAt: emergencyEvents[0].occurredAt,
          lastObservedAt: emergencyEvents[emergencyEvents.length - 1].occurredAt,
          evidence: { eventCount: emergencyEvents.length, windowDays: 7 }
        })
      );
    }

    const baselineEvents = householdEvents.filter((event) => {
      const age = daysBetween(now, new Date(event.occurredAt));
      return age >= 10 && age < 40;
    });
    const baselineActiveDays = uniqueDayCount(baselineEvents);
    const inactiveRecentEvents = householdEvents.filter((event) => withinDays(new Date(event.occurredAt), now, 10));
    if (baselineActiveDays >= 8 && inactiveRecentEvents.length === 0 && household.lastActiveAt) {
      signals.push(
        makeSignal({
          household,
          signalType: "SUDDEN_INACTIVITY",
          explanation: `Household was active on ${baselineActiveDays} days last month and has had no activity for 10 days.`,
          firstObservedAt: household.lastActiveAt,
          lastObservedAt: household.lastActiveAt,
          evidence: { baselineDays: baselineActiveDays, inactiveDays: 10 }
        })
      );
    }
  }

  return signals;
}

const mockHouseholds = [
  {
    id: "household-1",
    siteId: "site-sgo-bedok",
    lastActiveAt: "2025-04-03T10:00:00.000Z"
  },
  {
    id: "household-2",
    siteId: "site-sgo-bedok",
    lastActiveAt: "2025-03-22T08:00:00.000Z"
  }
];

const mockInteractionEvents = [
  {
    householdId: "household-1",
    templateKey: "emergency_contact",
    occurredAt: "2025-03-30T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-1",
    templateKey: "emergency_contact",
    occurredAt: "2025-04-01T08:15:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-1",
    templateKey: "emergency_contact",
    occurredAt: "2025-04-03T10:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "help_profile",
    occurredAt: "2025-03-05T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "help_profile",
    occurredAt: "2025-03-08T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "resource_links",
    occurredAt: "2025-03-12T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "frequent_contacts",
    occurredAt: "2025-03-14T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "frequent_contacts",
    occurredAt: "2025-03-16T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "reminder_checklist",
    occurredAt: "2025-03-18T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "resource_links",
    occurredAt: "2025-03-20T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "help_profile",
    occurredAt: "2025-03-21T08:00:00.000Z",
    outcome: "success"
  },
  {
    householdId: "household-2",
    templateKey: "resource_links",
    occurredAt: "2025-03-22T08:00:00.000Z",
    outcome: "success"
  }
];

test("creates repeated emergency usage signal from simple event counts", () => {
  const signals = deriveFollowUpSignals({
    households: [mockHouseholds[0]],
    events: mockInteractionEvents.filter((event) => event.householdId === "household-1")
  });

  assert.equal(signals.some((signal) => signal.signalType === "REPEATED_EMERGENCY_USAGE"), true);
});

test("creates inactivity signal only when there is a baseline and no recent activity", () => {
  const signals = deriveFollowUpSignals({
    households: [mockHouseholds[1]],
    events: mockInteractionEvents.filter((event) => event.householdId === "household-2")
  });

  assert.equal(signals.some((signal) => signal.signalType === "SUDDEN_INACTIVITY"), true);
});
