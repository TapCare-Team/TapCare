import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { buildFeatureSnapshots, labelForStickerType } from "@/modules/analytics/services/feature-analytics.service";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import { getHouseholdAnalyticsRepositories } from "@/modules/households/repositories/household-analytics.repository-provider";
import { MockSitesRepository } from "@/modules/households/repositories/mock-sites.repository";
import { PrismaSitesRepository, type SiteSummary } from "@/modules/households/repositories/prisma-sites.repository";
import { ForbiddenError } from "@/modules/shared/errors";

const prismaSitesRepository = new PrismaSitesRepository();
const mockSitesRepository = new MockSitesRepository();

function getSitesRepository() {
  return isDatabaseConfigured() ? prismaSitesRepository : mockSitesRepository;
}

function emptyEventCounts() {
  return {
    STICKER_OPENED: 0,
    REDIRECT_ISSUED: 0,
    PAGE_RENDERED: 0,
    PAGE_ACTION_CLICKED: 0
  };
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function buildIngestionHealth(events: InteractionEvent[], now = new Date()) {
  const eventCounts = events.reduce<Record<InteractionEvent["eventType"], number>>((accumulator, event) => {
    accumulator[event.eventType] += 1;
    return accumulator;
  }, emptyEventCounts());
  const sortedEvents = [...events].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );
  const lastEvent = sortedEvents[0];
  const last24hStart = now.getTime() - 24 * 60 * 60 * 1000;
  const eventsLast24h = events.filter((event) => new Date(event.occurredAt).getTime() >= last24hStart).length;
  const failedEvents = events.filter((event) => event.outcome === "FAILED").length;

  return {
    totalEvents: events.length,
    eventsLast24h,
    lastEventAt: lastEvent?.occurredAt ?? null,
    failedEvents,
    failureRate: events.length === 0 ? 0 : Number((failedEvents / events.length).toFixed(2)),
    eventCounts
  };
}

export function buildFailurePatterns(events: InteractionEvent[]) {
  const failedEvents = events
    .filter((event) => event.outcome === "FAILED")
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  return {
    totalFailures: failedEvents.length,
    byReason: countBy(failedEvents.map((event) => event.failureReason ?? "UNKNOWN")),
    byEventType: countBy(failedEvents.map((event) => event.eventType)),
    byStickerType: countBy(failedEvents.map((event) => event.stickerType ?? "UNKNOWN")),
    recentFailures: failedEvents.slice(0, 10).map((event) => ({
      occurredAt: event.occurredAt,
      siteId: event.siteId,
      householdId: event.householdId ?? null,
      stickerType: event.stickerType ?? null,
      eventType: event.eventType,
      failureReason: event.failureReason ?? "UNKNOWN"
    }))
  };
}

export function buildFeatureAdoption(events: InteractionEvent[]) {
  return buildFeatureSnapshots(events).map((snapshot) => ({
    ...snapshot,
    label: labelForStickerType(snapshot.stickerType)
  }));
}

async function loadAdminEvents() {
  const sitesRepository = getSitesRepository();
  const eventsRepository = getHouseholdAnalyticsRepositories().eventsRepository;
  const [sites, events] = await Promise.all([
    sitesRepository.listAll(),
    eventsRepository.listEvents()
  ]);

  return { sites, events } satisfies { sites: SiteSummary[]; events: InteractionEvent[] };
}

export async function getAdminAnalyticsSummary(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  const { sites, events } = await loadAdminEvents();

  return {
    dataSource: isDatabaseConfigured() ? "database" : "mock",
    siteCount: sites.length,
    ingestionHealth: buildIngestionHealth(events),
    failurePatterns: buildFailurePatterns(events),
    featureAdoption: buildFeatureAdoption(events)
  };
}

export async function getAdminIngestionHealth(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  const { sites, events } = await loadAdminEvents();

  return {
    dataSource: isDatabaseConfigured() ? "database" : "mock",
    siteCount: sites.length,
    ...buildIngestionHealth(events)
  };
}

export async function getAdminFailurePatterns(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  const { events } = await loadAdminEvents();
  return buildFailurePatterns(events);
}

export async function getAdminFeatureAdoption(user: SessionUser) {
  if (!canAccessAdminSurface(user)) {
    throw new ForbiddenError();
  }

  const { events } = await loadAdminEvents();
  return buildFeatureAdoption(events);
}
