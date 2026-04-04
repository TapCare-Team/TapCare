import { buildFeatureSnapshots } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { deriveFollowUpSignals } from "@/modules/signals/services/follow-up-signal.service";

const analyticsRepository = new MockAnalyticsRepository();
const householdsRepository = new MockHouseholdsRepository();

export async function getOfficerDashboardSummary(siteId: string) {
  const [households, events] = await Promise.all([
    householdsRepository.listBySite(siteId),
    analyticsRepository.listEventsBySite(siteId)
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
    householdsRepository.listBySite(siteId),
    analyticsRepository.listEventsBySite(siteId)
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
    householdsRepository.listBySite(siteId),
    analyticsRepository.listEventsBySite(siteId)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getSignalsForHouseholds(householdIds: string[]) {
  const [households, events] = await Promise.all([
    householdsRepository.listByIds(householdIds),
    analyticsRepository.listEventsByHouseholdIds(householdIds)
  ]);

  return deriveFollowUpSignals({ households, events });
}

export async function getHouseholdDetail(user: SessionUser, householdId: string) {
  const household = await householdsRepository.getById(householdId);
  if (!household || !canViewHousehold(user, household.id, household.siteId)) {
    return null;
  }

  const householdEvents = await analyticsRepository.listEventsByHouseholdIds([householdId]);
  const signals = deriveFollowUpSignals({ households: [household], events: householdEvents });

  return {
    household,
    recentEvents: householdEvents
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 12),
    signals,
    featureSnapshots: buildFeatureSnapshots(householdEvents)
  };
}
