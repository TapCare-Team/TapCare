import { buildFeatureSnapshots } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import {
  type HouseholdDetailFilters,
  resolveActivityWindow,
  toActivityWindowFormValues
} from "@/modules/households/domain/activity-range";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { deriveFollowUpSignals } from "@/modules/signals/services/follow-up-signal.service";
import { logger } from "@/lib/logging/logger";
import { isDatabaseConfigured } from "@/lib/db/database-mode";

const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();
const mockHouseholdsRepository = new MockHouseholdsRepository();
const prismaHouseholdsRepository = new PrismaHouseholdsRepository();

async function listHouseholdsBySite(siteId: string) {
  if (!isDatabaseConfigured()) {
    return mockHouseholdsRepository.listBySite(siteId);
  }

  try {
    return await prismaHouseholdsRepository.listBySite(siteId);
  } catch (error) {
    logger.warn("households_read_fallback_to_mock", { siteId, error: error instanceof Error ? error.message : "unknown" });
    return mockHouseholdsRepository.listBySite(siteId);
  }
}

async function listHouseholdsByIds(householdIds: string[]) {
  if (!isDatabaseConfigured()) {
    return mockHouseholdsRepository.listByIds(householdIds);
  }

  try {
    return await prismaHouseholdsRepository.listByIds(householdIds);
  } catch (error) {
    logger.warn("households_read_fallback_to_mock", {
      householdIds: householdIds.join(","),
      error: error instanceof Error ? error.message : "unknown"
    });
    return mockHouseholdsRepository.listByIds(householdIds);
  }
}

async function getHouseholdById(householdId: string) {
  if (!isDatabaseConfigured()) {
    return mockHouseholdsRepository.getById(householdId);
  }

  try {
    return await prismaHouseholdsRepository.getById(householdId);
  } catch (error) {
    logger.warn("household_read_fallback_to_mock", { householdId, error: error instanceof Error ? error.message : "unknown" });
    return mockHouseholdsRepository.getById(householdId);
  }
}

async function listEventsBySite(siteId: string) {
  if (!isDatabaseConfigured()) {
    return mockAnalyticsRepository.listEventsBySite(siteId);
  }

  try {
    return await prismaAnalyticsRepository.listEventsBySite(siteId);
  } catch (error) {
    logger.warn("interaction_events_read_fallback_to_mock", { siteId, error: error instanceof Error ? error.message : "unknown" });
    return mockAnalyticsRepository.listEventsBySite(siteId);
  }
}

async function listEventsByHouseholdIds(householdIds: string[]) {
  if (!isDatabaseConfigured()) {
    return mockAnalyticsRepository.listEventsByHouseholdIds(householdIds);
  }

  try {
    return await prismaAnalyticsRepository.listEventsByHouseholdIds(householdIds);
  } catch (error) {
    logger.warn("interaction_events_read_fallback_to_mock", {
      householdIds: householdIds.join(","),
      error: error instanceof Error ? error.message : "unknown"
    });
    return mockAnalyticsRepository.listEventsByHouseholdIds(householdIds);
  }
}

export async function getOfficerDashboardSummary(siteId: string) {
  const [households, events] = await Promise.all([
    listHouseholdsBySite(siteId),
    listEventsBySite(siteId)
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
  const [households, events] = await Promise.all([
    listHouseholdsBySite(siteId),
    listEventsBySite(siteId)
  ]);

  const signals = deriveFollowUpSignals({ households, events });
  const signalMap = new Map(signals.map((signal) => [signal.householdId, signal]));

  return households.map((household) => ({
    ...household,
    signal: signalMap.get(household.id) ?? null
  }));
}

export async function getSignalsForSite(siteId: string) {
  const [households, events] = await Promise.all([
    listHouseholdsBySite(siteId),
    listEventsBySite(siteId)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getSignalsForHouseholds(householdIds: string[]) {
  const [households, events] = await Promise.all([
    listHouseholdsByIds(householdIds),
    listEventsByHouseholdIds(householdIds)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getHouseholdDetail(user: SessionUser, householdId: string, filters?: HouseholdDetailFilters) {
  const household = await getHouseholdById(householdId);
  if (!household || !canViewHousehold(user, household.id, household.siteId)) {
    return null;
  }

  const householdEvents = await listEventsByHouseholdIds([householdId]);
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
