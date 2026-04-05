import { buildFeatureSnapshots } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import {
  type HouseholdDetailFilters,
  resolveActivityWindow,
  toActivityWindowFormValues
} from "@/modules/households/domain/activity-range";
import { getHouseholdAnalyticsRepositories } from "@/modules/households/repositories/household-analytics.repository-provider";
import type { Household } from "@/modules/households/domain/household";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";
import { getFollowUpStateRepository } from "@/modules/signals/repositories/follow-up-state.repository-provider";
import {
  deriveFollowUpSignals,
  isSignalActionable,
  mergePersistedSignalState
} from "@/modules/signals/services/follow-up-signal.service";

function normalizeSiteIds(siteIds: string[]) {
  return Array.from(new Set(siteIds.filter(Boolean)));
}

function toSiteScope(siteIds: string | string[]) {
  return normalizeSiteIds(Array.isArray(siteIds) ? siteIds : [siteIds]);
}

async function deriveScopedSignals(siteIds: string | string[]) {
  const normalizedSiteIds = toSiteScope(siteIds);
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events]: [Household[], InteractionEvent[]] =
    normalizedSiteIds.length === 0
      ? [[], []]
      : await Promise.all([
          householdsRepository.listBySiteIds(normalizedSiteIds),
          eventsRepository.listEventsBySiteIds(normalizedSiteIds)
        ]);

  const derivedSignals = deriveFollowUpSignals({ households, events });
  const repository = getFollowUpStateRepository();
  await repository.syncDerivedSignals(derivedSignals);
  const [persistedSignals, latestReviews] = await Promise.all([
    repository.listSignalStatesByIds(derivedSignals.map((signal) => signal.id)),
    repository.listLatestReviewsBySignalIds(derivedSignals.map((signal) => signal.id))
  ]);

  return {
    households,
    events,
    signals: mergePersistedSignalState(derivedSignals, persistedSignals, latestReviews)
  } satisfies {
    households: Household[];
    events: InteractionEvent[];
    signals: FollowUpSignal[];
  };
}

export async function getOfficerDashboardSummary(siteIds: string | string[]) {
  const { households, events, signals } = await deriveScopedSignals(siteIds);
  const actionableSignals = signals.filter((signal) => isSignalActionable(signal));
  const activeStickerHouseholds = households.filter((household) =>
    household.stickers.some((sticker) => sticker.status === "ACTIVE")
  ).length;
  const inactiveCandidates = actionableSignals.filter((signal) => signal.signalType === "SUDDEN_INACTIVITY").length;

  return {
    followUpCandidates: actionableSignals.length,
    activeStickerHouseholds,
    inactiveCandidates,
    featureSnapshots: buildFeatureSnapshots(events),
    signals: actionableSignals.slice(0, 6)
  };
}

export async function getOfficerHouseholds(siteIds: string | string[]) {
  const { households, signals } = await deriveScopedSignals(siteIds);
  const signalMap = new Map(
    signals.filter((signal) => isSignalActionable(signal)).map((signal) => [signal.householdId, signal])
  );

  return households.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getHouseholdsByIds(householdIds: string[]) {
  const { householdsRepository } = getHouseholdAnalyticsRepositories();
  const [households, signals] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    getSignalsForHouseholds(householdIds)
  ]);
  const signalMap = new Map(
    signals.filter((signal) => isSignalActionable(signal)).map((signal) => [signal.householdId, signal])
  );

  return households.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getSignalsForSites(siteIds: string | string[]) {
  const { signals } = await deriveScopedSignals(siteIds);
  return signals.filter((signal) => isSignalActionable(signal));
}

export async function getSignalsForHouseholds(householdIds: string[]) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    eventsRepository.listEventsByHouseholdIds(householdIds)
  ]);

  const derivedSignals = deriveFollowUpSignals({ households, events });
  const repository = getFollowUpStateRepository();
  await repository.syncDerivedSignals(derivedSignals);
  const [persistedSignals, latestReviews] = await Promise.all([
    repository.listSignalStatesByIds(derivedSignals.map((signal) => signal.id)),
    repository.listLatestReviewsBySignalIds(derivedSignals.map((signal) => signal.id))
  ]);

  return mergePersistedSignalState(derivedSignals, persistedSignals, latestReviews);
}

export async function getHouseholdDetail(user: SessionUser, householdId: string, filters?: HouseholdDetailFilters) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const household = await householdsRepository.getById(householdId);
  if (!household || !canViewHousehold(user, household.id, household.siteId)) {
    return null;
  }

  const householdEvents = await eventsRepository.listEventsByHouseholdIds([householdId]);
  const derivedSignals = deriveFollowUpSignals({ households: [household], events: householdEvents });
  const repository = getFollowUpStateRepository();
  await repository.syncDerivedSignals(derivedSignals);
  const [persistedSignals, latestReviews] = await Promise.all([
    repository.listSignalStatesByIds(derivedSignals.map((signal) => signal.id)),
    repository.listLatestReviewsBySignalIds(derivedSignals.map((signal) => signal.id))
  ]);
  const signals = mergePersistedSignalState(derivedSignals, persistedSignals, latestReviews);
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
