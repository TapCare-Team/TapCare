import { buildFeatureSnapshots } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import {
  type HouseholdDetailFilters,
  resolveActivityWindow,
  toActivityWindowFormValues
} from "@/modules/households/domain/activity-range";
import { getHouseholdAnalyticsRepositories } from "@/modules/households/repositories/household-analytics.repository-provider";
import { deriveFollowUpSignals } from "@/modules/signals/services/follow-up-signal.service";

export async function getOfficerDashboardSummary(siteId: string) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listBySite(siteId),
    eventsRepository.listEventsBySite(siteId)
  ]);

  const signals = deriveFollowUpSignals({ households, events });
  const activeStickerHouseholds = households.filter((household) =>
    household.stickers.some((sticker) => sticker.status === "ACTIVE")
  ).length;
  const inactiveCandidates = signals.filter((signal) => signal.signalType === "SUDDEN_INACTIVITY").length;

  return {
    followUpCandidates: signals.length,
    activeStickerHouseholds,
    inactiveCandidates,
    featureSnapshots: buildFeatureSnapshots(events),
    signals: signals.slice(0, 6)
  };
}

export async function getOfficerHouseholds(siteId: string) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listBySite(siteId),
    eventsRepository.listEventsBySite(siteId)
  ]);

  const signals = deriveFollowUpSignals({ households, events });
  const signalMap = new Map(signals.map((signal) => [signal.householdId, signal]));

  return households.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getSignalsForSite(siteId: string) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listBySite(siteId),
    eventsRepository.listEventsBySite(siteId)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getSignalsForHouseholds(householdIds: string[]) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    eventsRepository.listEventsByHouseholdIds(householdIds)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getHouseholdDetail(user: SessionUser, householdId: string, filters?: HouseholdDetailFilters) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const household = await householdsRepository.getById(householdId);
  if (!household || !canViewHousehold(user, household.id, household.siteId)) {
    return null;
  }

  const householdEvents = await eventsRepository.listEventsByHouseholdIds([householdId]);
  const signals = deriveFollowUpSignals({ households: [household], events: householdEvents });
  const sortedEvents = householdEvents.sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );
  const anchorDate = sortedEvents[0] ? new Date(sortedEvents[0].occurredAt) : new Date();
  const earliestEventDate = sortedEvents[sortedEvents.length - 1]
    ? new Date(sortedEvents[sortedEvents.length - 1].occurredAt)
    : null;
  const activityWindow = resolveActivityWindow(filters, anchorDate);
  const recentEvents = sortedEvents.filter((event) => {
    const occurredAt = new Date(event.occurredAt).getTime();

    if (activityWindow.startAt && occurredAt < activityWindow.startAt.getTime()) {
      return false;
    }

    if (activityWindow.endAt && occurredAt > activityWindow.endAt.getTime()) {
      return false;
    }

    return true;
  });

  return {
    household,
    recentEvents,
    signals,
    featureSnapshots: buildFeatureSnapshots(householdEvents),
    activityWindow: {
      preset: activityWindow.preset,
      ...toActivityWindowFormValues(activityWindow)
    },
    activityBounds: {
      earliest: earliestEventDate?.toISOString().slice(0, 10) ?? "",
      latest: sortedEvents[0]?.occurredAt.slice(0, 10) ?? ""
    }
  };
}
