import type { InteractionEvent, TemplateKey } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import type { FollowUpSignal, SignalType } from "@/modules/signals/domain/follow-up-signal";

type BuildSignalsInput = {
  households: Household[];
  events: InteractionEvent[];
  now?: Date;
};

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function withinDays(eventDate: Date, now: Date, windowDays: number) {
  return daysBetween(now, eventDate) < windowDays;
}

function uniqueDayCount(events: InteractionEvent[]) {
  return new Set(events.map((event) => event.occurredAt.slice(0, 10))).size;
}

function makeSignal(params: {
  household: Household;
  signalType: SignalType;
  explanation: string;
  firstObservedAt: string;
  lastObservedAt: string;
  evidence: Record<string, number | string>;
}): FollowUpSignal {
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

function byTemplate(events: InteractionEvent[], templateKey: TemplateKey) {
  return events.filter((event) => event.templateKey === templateKey && event.outcome === "success");
}

export function deriveFollowUpSignals({
  households,
  events,
  now = new Date("2025-04-04T09:00:00.000Z")
}: BuildSignalsInput): FollowUpSignal[] {
  const signals: FollowUpSignal[] = [];

  for (const household of households) {
    const householdEvents = events.filter((event) => event.householdId === household.id);
    const recentEvents = householdEvents.filter((event) => withinDays(new Date(event.occurredAt), now, 7));
    const recentByTemplate = (templateKey: TemplateKey) => byTemplate(recentEvents, templateKey);

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

    const helpEvents = recentByTemplate("help_profile");
    if (helpEvents.length >= 4) {
      signals.push(
        makeSignal({
          household,
          signalType: "REPEATED_HELP_PROFILE_USAGE",
          explanation: `Help profile page opened ${helpEvents.length} times in 7 days.`,
          firstObservedAt: helpEvents[0].occurredAt,
          lastObservedAt: helpEvents[helpEvents.length - 1].occurredAt,
          evidence: { eventCount: helpEvents.length, windowDays: 7 }
        })
      );
    }

    const contactEvents = recentByTemplate("frequent_contacts");
    const contactDays = uniqueDayCount(contactEvents);
    if (contactEvents.length >= 10 && contactDays >= 3) {
      signals.push(
        makeSignal({
          household,
          signalType: "HIGH_CONTACT_DEPENDENCE",
          explanation: `Contact sticker used ${contactEvents.length} times across ${contactDays} days in the last week.`,
          firstObservedAt: contactEvents[0].occurredAt,
          lastObservedAt: contactEvents[contactEvents.length - 1].occurredAt,
          evidence: { eventCount: contactEvents.length, activeDays: contactDays }
        })
      );
    }

    const reminderEvents = recentByTemplate("reminder_checklist");
    const reminderByDay = reminderEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.occurredAt.slice(0, 10)] = (acc[event.occurredAt.slice(0, 10)] ?? 0) + 1;
      return acc;
    }, {});
    const reminderHeavyDays = Object.values(reminderByDay).filter((count) => count >= 2).length;
    if (reminderEvents.length >= 14 || reminderHeavyDays >= 5) {
      signals.push(
        makeSignal({
          household,
          signalType: "HIGH_REMINDER_DEPENDENCE",
          explanation: `Reminder sticker used repeatedly on ${reminderHeavyDays} days this week.`,
          firstObservedAt: reminderEvents[0]?.occurredAt ?? now.toISOString(),
          lastObservedAt: reminderEvents[reminderEvents.length - 1]?.occurredAt ?? now.toISOString(),
          evidence: { eventCount: reminderEvents.length, heavyDays: reminderHeavyDays }
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

    for (const artifact of household.artifacts.filter((item) => item.isKeySticker)) {
      const issuedAge = daysBetween(now, new Date(artifact.issuedAt));
      const artifactEvents = householdEvents.filter((event) => event.templateKey === artifact.templateKey);
      const recentArtifactEvents = artifactEvents.filter((event) =>
        withinDays(new Date(event.occurredAt), now, 30)
      );

      if (artifact.activationState === "PROVISIONED" && issuedAge > 14) {
        signals.push(
          makeSignal({
            household,
            signalType: "NEVER_ACTIVATED_KEY_STICKER",
            explanation: `${artifact.name} issued ${issuedAge} days ago has not been activated.`,
            firstObservedAt: artifact.issuedAt,
            lastObservedAt: artifact.issuedAt,
            evidence: { issuedAgeDays: issuedAge }
          })
        );
      }

      if (
        artifact.activationState === "ACTIVATED" &&
        artifactEvents.some((event) => event.outcome === "success") &&
        recentArtifactEvents.length === 0
      ) {
        const lastEvent = artifactEvents[artifactEvents.length - 1];
        signals.push(
          makeSignal({
            household,
            signalType: "STOPPED_USING_KEY_STICKER",
            explanation: `${artifact.name} was previously used and has not been used in the last 30 days.`,
            firstObservedAt: lastEvent.occurredAt,
            lastObservedAt: lastEvent.occurredAt,
            evidence: { inactiveDays: 30 }
          })
        );
      }
    }

    const failedEvents = recentEvents.filter((event) => event.outcome === "failed");
    const attempts = recentEvents.length;
    const failureRate = attempts === 0 ? 0 : failedEvents.length / attempts;
    if (failedEvents.length >= 3 || (attempts >= 5 && failureRate > 0.4)) {
      signals.push(
        makeSignal({
          household,
          signalType: "REPEATED_FAILED_INTERACTIONS",
          explanation: `${failedEvents.length} failed interactions recorded in 7 days.`,
          firstObservedAt: failedEvents[0]?.occurredAt ?? now.toISOString(),
          lastObservedAt: failedEvents[failedEvents.length - 1]?.occurredAt ?? now.toISOString(),
          evidence: { failedEvents: failedEvents.length, attempts, failureRate: Number(failureRate.toFixed(2)) }
        })
      );
    }
  }

  return signals.sort(
    (left, right) => new Date(right.lastObservedAt).getTime() - new Date(left.lastObservedAt).getTime()
  );
}
