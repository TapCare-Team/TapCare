import type { Household } from "@/modules/households/domain/household";
import type { InteractionEvent, StickerType } from "@/modules/analytics/domain/analytics";
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

function openedByType(events: InteractionEvent[], stickerType: StickerType) {
  return events.filter(
    (event) =>
      event.stickerType === stickerType &&
      event.eventType === "STICKER_OPENED" &&
      event.outcome === "SUCCESS"
  );
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

export function deriveFollowUpSignals({
  households,
  events,
  now = new Date()
}: BuildSignalsInput): FollowUpSignal[] {
  const signals: FollowUpSignal[] = [];

  for (const household of households) {
    const householdEvents = events.filter((event) => event.householdId === household.id);
    const recentEvents = householdEvents.filter((event) => withinDays(new Date(event.occurredAt), now, 7));

    const emergencyEvents = openedByType(recentEvents, "EMERGENCY_CONTACT");
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

    const helpEvents = openedByType(recentEvents, "HELP_PROFILE");
    if (helpEvents.length >= 4) {
      signals.push(
        makeSignal({
          household,
          signalType: "REPEATED_HELP_PROFILE_USAGE",
          explanation: `Help profile sticker opened ${helpEvents.length} times in 7 days.`,
          firstObservedAt: helpEvents[0].occurredAt,
          lastObservedAt: helpEvents[helpEvents.length - 1].occurredAt,
          evidence: { eventCount: helpEvents.length, windowDays: 7 }
        })
      );
    }

    const contactEvents = openedByType(recentEvents, "FREQUENT_CONTACT");
    const contactDays = uniqueDayCount(contactEvents);
    if (contactEvents.length >= 10 && contactDays >= 3) {
      signals.push(
        makeSignal({
          household,
          signalType: "HIGH_CONTACT_USAGE",
          explanation: `Contact sticker used ${contactEvents.length} times across ${contactDays} days in the last week.`,
          firstObservedAt: contactEvents[0].occurredAt,
          lastObservedAt: contactEvents[contactEvents.length - 1].occurredAt,
          evidence: { eventCount: contactEvents.length, activeDays: contactDays }
        })
      );
    }

    const reminderEvents = openedByType(recentEvents, "CHECKLIST_REMINDER");
    const reminderByDay = reminderEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.occurredAt.slice(0, 10)] = (acc[event.occurredAt.slice(0, 10)] ?? 0) + 1;
      return acc;
    }, {});
    const reminderHeavyDays = Object.values(reminderByDay).filter((count) => count >= 2).length;
    if (reminderEvents.length >= 14 || reminderHeavyDays >= 5) {
      signals.push(
        makeSignal({
          household,
          signalType: "HIGH_REMINDER_USAGE",
          explanation: `Reminder sticker used repeatedly on ${reminderHeavyDays} days this week.`,
          firstObservedAt: reminderEvents[0]?.occurredAt ?? now.toISOString(),
          lastObservedAt: reminderEvents[reminderEvents.length - 1]?.occurredAt ?? now.toISOString(),
          evidence: { eventCount: reminderEvents.length, heavyDays: reminderHeavyDays }
        })
      );
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
      signals.push(
        makeSignal({
          household,
          signalType: "SUDDEN_INACTIVITY",
          explanation: `Household was active on ${baselineActiveDays} days last month and has had no sticker activity for 10 days.`,
          firstObservedAt: household.lastActiveAt,
          lastObservedAt: household.lastActiveAt,
          evidence: { baselineDays: baselineActiveDays, inactiveDays: 10 }
        })
      );
    }

    const hasActiveCriticalSticker = household.stickers.some(
      (sticker) =>
        sticker.status === "ACTIVE" &&
        (sticker.stickerType === "EMERGENCY_CONTACT" || sticker.stickerType === "HELP_PROFILE")
    );
    if (!hasActiveCriticalSticker) {
      signals.push(
        makeSignal({
          household,
          signalType: "NO_ACTIVE_CRITICAL_STICKER",
          explanation: "Household does not currently have an active emergency contact or help profile sticker.",
          firstObservedAt: now.toISOString(),
          lastObservedAt: now.toISOString(),
          evidence: { activeCriticalStickers: 0 }
        })
      );
    }

    const failedEvents = recentEvents.filter((event) => event.outcome === "FAILED");
    const attempts = recentEvents.filter((event) => event.eventType === "STICKER_OPENED").length;
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

type PersistedSignalState = Pick<FollowUpSignal, "id" | "status">;

type LatestSignalReview = {
  signalId: string;
  review: NonNullable<FollowUpSignal["review"]>;
};

export function mergePersistedSignalState(
  signals: FollowUpSignal[],
  persistedSignalStates: PersistedSignalState[],
  latestReviews: LatestSignalReview[]
) {
  const persistedSignalsById = new Map(persistedSignalStates.map((signal) => [signal.id, signal]));
  const latestReviewsBySignalId = new Map(latestReviews.map((entry) => [entry.signalId, entry.review]));

  return signals.map((signal) => {
    const persistedSignal = persistedSignalsById.get(signal.id);
    const latestReview = latestReviewsBySignalId.get(signal.id);
    const mergedStatus = persistedSignal?.status ?? signal.status;
    const mergedReview =
      latestReview && (mergedStatus === "DISMISSED" || mergedStatus === "RESOLVED")
        ? { ...latestReview, status: mergedStatus }
        : latestReview;

    return {
      ...signal,
      status: mergedStatus,
      review: mergedReview
    };
  });
}

export function isSignalActionable(signal: FollowUpSignal, now = new Date()) {
  if (signal.review?.status === "SNOOZED" && signal.review.snoozedUntil) {
    return new Date(signal.review.snoozedUntil).getTime() <= now.getTime();
  }

  return signal.status === "ACTIVE";
}
