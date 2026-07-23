import { buildFeatureSnapshots } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import {
  type HouseholdDetailFilters,
  resolveActivityWindow,
  toActivityWindowFormValues
} from "@/modules/households/domain/activity-range";
import { withDerivedLastActiveAt } from "@/modules/households/domain/household-last-active";
import { getHouseholdAnalyticsRepositories } from "@/modules/households/repositories/household-analytics.repository-provider";
import { MockSitesRepository } from "@/modules/households/repositories/mock-sites.repository";
import { PrismaSitesRepository } from "@/modules/households/repositories/prisma-sites.repository";
import type { Household } from "@/modules/households/domain/household";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";
import { getFollowUpStateRepository } from "@/modules/signals/repositories/follow-up-state.repository-provider";
import {
  deriveFollowUpSignals,
  isSignalActionable,
  mergePersistedSignalState
} from "@/modules/signals/services/follow-up-signal.service";

const prismaSitesRepository = new PrismaSitesRepository();
const mockSitesRepository = new MockSitesRepository();

function normalizeSiteIds(siteIds: string[]) {
  return Array.from(new Set(siteIds.filter(Boolean)));
}

function toSiteScope(siteIds: string | string[]) {
  return normalizeSiteIds(Array.isArray(siteIds) ? siteIds : [siteIds]);
}

async function derivePersistedSignals(households: Household[], events: InteractionEvent[]) {
  const derivedSignals = deriveFollowUpSignals({ households, events });
  const repository = getFollowUpStateRepository();
  await repository.syncDerivedSignals(derivedSignals);
  const [persistedSignals, latestReviews] = await Promise.all([
    repository.listSignalStatesByIds(derivedSignals.map((signal) => signal.id)),
    repository.listLatestReviewsBySignalIds(derivedSignals.map((signal) => signal.id))
  ]);

  return mergePersistedSignalState(derivedSignals, persistedSignals, latestReviews);
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

  const householdsWithLastActive = withDerivedLastActiveAt(households, events);

  return {
    households: householdsWithLastActive,
    events,
    signals: await derivePersistedSignals(householdsWithLastActive, events)
  } satisfies {
    households: Household[];
    events: InteractionEvent[];
    signals: FollowUpSignal[];
  };
}

async function deriveScopedSignalsForAdmin() {
  const sitesRepository = isDatabaseConfigured() ? prismaSitesRepository : mockSitesRepository;
  const sites = await sitesRepository.listAll();
  return deriveScopedSignals(sites.map((site) => site.id));
}

export async function getAdminDashboardSummary(siteIds?: string | string[]) {
  const { households, events, signals } = siteIds ? await deriveScopedSignals(siteIds) : await deriveScopedSignalsForAdmin();
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

export async function getAdminHouseholds(siteIds?: string | string[]) {
  const { households, signals } = siteIds ? await deriveScopedSignals(siteIds) : await deriveScopedSignalsForAdmin();
  const signalMap = new Map(
    signals.filter((signal) => isSignalActionable(signal)).map((signal) => [signal.householdId, signal])
  );

  return households.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getHouseholdsByIds(householdIds: string[]) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    eventsRepository.listEventsByHouseholdIds(householdIds)
  ]);
  const householdsWithLastActive = withDerivedLastActiveAt(households, events);
  const signals = await derivePersistedSignals(householdsWithLastActive, events);
  const signalMap = new Map(
    signals.filter((signal) => isSignalActionable(signal)).map((signal) => [signal.householdId, signal])
  );

  return householdsWithLastActive.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getSignalsForSites(siteIds?: string | string[]) {
  const { signals } = siteIds ? await deriveScopedSignals(siteIds) : await deriveScopedSignalsForAdmin();
  return signals.filter((signal) => isSignalActionable(signal));
}

export async function getSignalsForHouseholds(householdIds: string[]) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const [households, events] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    eventsRepository.listEventsByHouseholdIds(householdIds)
  ]);
  const householdsWithLastActive = withDerivedLastActiveAt(households, events);

  return derivePersistedSignals(householdsWithLastActive, events);
}

export async function getHouseholdDetail(user: SessionUser, householdId: string, filters?: HouseholdDetailFilters) {
  const { householdsRepository, eventsRepository } = getHouseholdAnalyticsRepositories();
  const household = await householdsRepository.getById(householdId);
  if (!household || !canViewHousehold(user, household.id, household.siteId)) {
    return null;
  }

  const householdEvents = await eventsRepository.listEventsByHouseholdIds([householdId]);
  const [householdWithLastActive] = withDerivedLastActiveAt([household], householdEvents);
  const resolvedHousehold = householdWithLastActive ?? household;
  const signals = await derivePersistedSignals([resolvedHousehold], householdEvents);
  const sortedEvents = householdEvents.sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );
  const anchorDate = sortedEvents[0] ? new Date(sortedEvents[0].occurredAt) : new Date();
  const earliestEventDate = sortedEvents[sortedEvents.length - 1]
    ? new Date(sortedEvents[sortedEvents.length - 1].occurredAt)
    : null;
  const activityWindow = resolveActivityWindow(filters, anchorDate);
  const activityWindowFormValues = toActivityWindowFormValues(activityWindow);
  const recentEvents = sortedEvents.filter((event) => {
    if (activityWindow.preset === "custom") {
      const eventDay = event.occurredAt.slice(0, 10);

      if (activityWindowFormValues.from && eventDay < activityWindowFormValues.from) {
        return false;
      }

      if (activityWindowFormValues.to && eventDay > activityWindowFormValues.to) {
        return false;
      }

      return true;
    }

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
    household: resolvedHousehold,
    recentEvents,
    signals,
    featureSnapshots: buildFeatureSnapshots(householdEvents),
    activityWindow: {
      preset: activityWindow.preset,
      ...activityWindowFormValues
    },
    activityBounds: {
      earliest: earliestEventDate?.toISOString().slice(0, 10) ?? "",
      latest: sortedEvents[0]?.occurredAt.slice(0, 10) ?? ""
    }
  };
}
