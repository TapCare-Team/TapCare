import { getDataMode } from "@/lib/db/database-mode";
import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { MockPublicRuntimeRepository } from "@/modules/runtime/repositories/public-runtime.repository.mock";
import { PrismaPublicRuntimeRepository } from "@/modules/runtime/repositories/public-runtime.repository.prisma";

const mockPublicRuntimeRepository = new MockPublicRuntimeRepository();
const prismaPublicRuntimeRepository = new PrismaPublicRuntimeRepository();
const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();

export function getPublicRuntimeRepositories() {
  const dataMode = getDataMode();

  return {
    runtimeRepository: {
      async getByPublicCode(publicCode: string): Promise<RuntimeRecord | null> {
        if (dataMode === "mock") {
          return mockPublicRuntimeRepository.getByPublicCode(publicCode);
        }

        return prismaPublicRuntimeRepository.getByPublicCode(publicCode);
      }
    },
    eventsRepository: {
      async createEvent(event: InteractionEvent) {
        if (dataMode === "mock") {
          return mockAnalyticsRepository.createEvent(event);
        }

        return prismaAnalyticsRepository.createEvent(event);
      }
    }
  };
}
