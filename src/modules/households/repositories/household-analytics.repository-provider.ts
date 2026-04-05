import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { logger } from "@/lib/logging/logger";

export type HouseholdAnalyticsHouseholdsRepository = Pick<
  PrismaHouseholdsRepository,
  "listBySite" | "listBySiteIds" | "listByIds" | "getById"
>;

export type HouseholdAnalyticsEventsRepository = Pick<
  PrismaAnalyticsRepository,
  "listEventsBySite" | "listEventsBySiteIds" | "listEventsByHouseholdIds"
>;

const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();
const mockHouseholdsRepository = new MockHouseholdsRepository();
const prismaHouseholdsRepository = new PrismaHouseholdsRepository();

function buildFallbackReadRepository<TArgs extends unknown[], TResult>(
  params: {
    logKey: string;
    invokePrisma: (...args: TArgs) => Promise<TResult>;
    invokeMock: (...args: TArgs) => Promise<TResult>;
    buildLogContext: (...args: TArgs) => Record<string, string>;
  }
) {
  return async (...args: TArgs) => {
    if (!isDatabaseConfigured()) {
      return params.invokeMock(...args);
    }

    try {
      return await params.invokePrisma(...args);
    } catch (error) {
      logger.warn(params.logKey, {
        ...params.buildLogContext(...args),
        error: error instanceof Error ? error.message : "unknown"
      });
      return params.invokeMock(...args);
    }
  };
}

export function getHouseholdAnalyticsRepositories(): {
  householdsRepository: {
    listBySiteIds(siteIds: string[]): Promise<Household[]>;
    listBySite(siteId: string): Promise<Household[]>;
    listByIds(householdIds: string[]): Promise<Household[]>;
    getById(householdId: string): Promise<Household | null>;
  };
  eventsRepository: {
    listEventsBySiteIds(siteIds: string[]): Promise<InteractionEvent[]>;
    listEventsBySite(siteId: string): Promise<InteractionEvent[]>;
    listEventsByHouseholdIds(householdIds: string[]): Promise<InteractionEvent[]>;
  };
} {
  return {
    householdsRepository: {
      listBySiteIds: buildFallbackReadRepository({
        logKey: "households_read_fallback_to_mock",
        invokePrisma: (siteIds: string[]) => prismaHouseholdsRepository.listBySiteIds(siteIds),
        invokeMock: (siteIds: string[]) => mockHouseholdsRepository.listBySiteIds(siteIds),
        buildLogContext: (siteIds: string[]) => ({ siteIds: siteIds.join(",") })
      }),
      listBySite: buildFallbackReadRepository({
        logKey: "households_read_fallback_to_mock",
        invokePrisma: (siteId: string) => prismaHouseholdsRepository.listBySite(siteId),
        invokeMock: (siteId: string) => mockHouseholdsRepository.listBySite(siteId),
        buildLogContext: (siteId: string) => ({ siteId })
      }),
      listByIds: buildFallbackReadRepository({
        logKey: "households_read_fallback_to_mock",
        invokePrisma: (householdIds: string[]) => prismaHouseholdsRepository.listByIds(householdIds),
        invokeMock: (householdIds: string[]) => mockHouseholdsRepository.listByIds(householdIds),
        buildLogContext: (householdIds: string[]) => ({ householdIds: householdIds.join(",") })
      }),
      getById: buildFallbackReadRepository({
        logKey: "household_read_fallback_to_mock",
        invokePrisma: (householdId: string) => prismaHouseholdsRepository.getById(householdId),
        invokeMock: (householdId: string) => mockHouseholdsRepository.getById(householdId),
        buildLogContext: (householdId: string) => ({ householdId })
      })
    },
    eventsRepository: {
      listEventsBySiteIds: buildFallbackReadRepository({
        logKey: "interaction_events_read_fallback_to_mock",
        invokePrisma: (siteIds: string[]) => prismaAnalyticsRepository.listEventsBySiteIds(siteIds),
        invokeMock: (siteIds: string[]) => mockAnalyticsRepository.listEventsBySiteIds(siteIds),
        buildLogContext: (siteIds: string[]) => ({ siteIds: siteIds.join(",") })
      }),
      listEventsBySite: buildFallbackReadRepository({
        logKey: "interaction_events_read_fallback_to_mock",
        invokePrisma: (siteId: string) => prismaAnalyticsRepository.listEventsBySite(siteId),
        invokeMock: (siteId: string) => mockAnalyticsRepository.listEventsBySite(siteId),
        buildLogContext: (siteId: string) => ({ siteId })
      }),
      listEventsByHouseholdIds: buildFallbackReadRepository({
        logKey: "interaction_events_read_fallback_to_mock",
        invokePrisma: (householdIds: string[]) => prismaAnalyticsRepository.listEventsByHouseholdIds(householdIds),
        invokeMock: (householdIds: string[]) => mockAnalyticsRepository.listEventsByHouseholdIds(householdIds),
        buildLogContext: (householdIds: string[]) => ({ householdIds: householdIds.join(",") })
      })
    }
  };
}
