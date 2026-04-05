import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import type { Household } from "@/modules/households/domain/household";
import { MockHouseholdsRepository } from "@/modules/households/repositories/mock-households.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { logger } from "@/lib/logging/logger";

const mockHouseholdsRepository = new MockHouseholdsRepository();
const prismaHouseholdsRepository = new PrismaHouseholdsRepository();
const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();

export function getStickerRuntimeRepositories(): {
  householdsRepository: {
    getByStickerPublicCode(publicCode: string): Promise<Household | null>;
  };
  eventsRepository: {
    createEvent(event: InteractionEvent): Promise<InteractionEvent>;
  };
} {
  return {
    householdsRepository: {
      async getByStickerPublicCode(publicCode: string) {
        if (!isDatabaseConfigured()) {
          return mockHouseholdsRepository.getByStickerPublicCode(publicCode);
        }

        try {
          return await prismaHouseholdsRepository.getByStickerPublicCode(publicCode);
        } catch (error) {
          logger.warn("public_sticker_read_fallback_to_mock", {
            publicCode,
            error: error instanceof Error ? error.message : "unknown"
          });
          return mockHouseholdsRepository.getByStickerPublicCode(publicCode);
        }
      }
    },
    eventsRepository: {
      async createEvent(event: InteractionEvent) {
        if (!isDatabaseConfigured()) {
          return mockAnalyticsRepository.createEvent(event);
        }

        try {
          return await prismaAnalyticsRepository.createEvent(event);
        } catch (error) {
          logger.warn("runtime_event_persist_fallback_to_mock", {
            publicCode: event.publicCode ?? "unknown",
            eventType: event.eventType,
            error: error instanceof Error ? error.message : "unknown"
          });
          return mockAnalyticsRepository.createEvent(event);
        }
      }
    }
  };
}
