import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { isDatabaseConfigured } from "@/lib/db/database-mode";

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

function buildReadRepository<TArgs extends unknown[], TResult>(
  params: {
    invokePrisma: (...args: TArgs) => Promise<TResult>;
    invokeMock: (...args: TArgs) => Promise<TResult>;
  }
) {
  return async (...args: TArgs) => {
    if (!isDatabaseConfigured()) {
      return params.invokeMock(...args);
    }

    return params.invokePrisma(...args);
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
      listBySiteIds: buildReadRepository({
        invokePrisma: (siteIds: string[]) => prismaHouseholdsRepository.listBySiteIds(siteIds),
        invokeMock: (siteIds: string[]) => mockHouseholdsRepository.listBySiteIds(siteIds)
      }),
      listBySite: buildReadRepository({
        invokePrisma: (siteId: string) => prismaHouseholdsRepository.listBySite(siteId),
        invokeMock: (siteId: string) => mockHouseholdsRepository.listBySite(siteId)
      }),
      listByIds: buildReadRepository({
        invokePrisma: (householdIds: string[]) => prismaHouseholdsRepository.listByIds(householdIds),
        invokeMock: (householdIds: string[]) => mockHouseholdsRepository.listByIds(householdIds)
      }),
      getById: buildReadRepository({
        invokePrisma: (householdId: string) => prismaHouseholdsRepository.getById(householdId),
        invokeMock: (householdId: string) => mockHouseholdsRepository.getById(householdId)
      })
    },
    eventsRepository: {
      listEventsBySiteIds: buildReadRepository({
        invokePrisma: (siteIds: string[]) => prismaAnalyticsRepository.listEventsBySiteIds(siteIds),
        invokeMock: (siteIds: string[]) => mockAnalyticsRepository.listEventsBySiteIds(siteIds)
      }),
      listEventsBySite: buildReadRepository({
        invokePrisma: (siteId: string) => prismaAnalyticsRepository.listEventsBySite(siteId),
        invokeMock: (siteId: string) => mockAnalyticsRepository.listEventsBySite(siteId)
      }),
      listEventsByHouseholdIds: buildReadRepository({
        invokePrisma: (householdIds: string[]) => prismaAnalyticsRepository.listEventsByHouseholdIds(householdIds),
        invokeMock: (householdIds: string[]) => mockAnalyticsRepository.listEventsByHouseholdIds(householdIds)
      })
    }
  };
}
