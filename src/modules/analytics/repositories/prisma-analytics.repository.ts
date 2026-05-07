import { prisma } from "@/lib/db/prisma";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { mapPrismaInteractionEvent } from "@/modules/households/repositories/prisma-mappers";

export class PrismaAnalyticsRepository {
  async listEventsBySiteIds(siteIds: string[]) {
    const events = await prisma.interactionEvent.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async listEventsBySite(siteId: string) {
    const events = await prisma.interactionEvent.findMany({
      where: { siteId },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async listEventsByHouseholdIds(householdIds: string[]) {
    const events = await prisma.interactionEvent.findMany({
      where: { householdId: { in: householdIds } },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async createEvent(event: InteractionEvent) {
    const created = await prisma.interactionEvent.create({
      data: {
        occurredAt: new Date(event.occurredAt),
        siteId: event.siteId,
        householdId: event.householdId,
        seniorProfileId: event.seniorProfileId,
        stickerId: event.stickerId,
        publicCode: event.publicCode,
        stickerType: event.stickerType,
        runtimeMode: event.runtimeMode,
        eventType: event.eventType,
        outcome: event.outcome,
        destinationType: event.destinationType,
        failureReason: event.failureReason,
        sessionTokenHash: event.sessionTokenHash,
        metadata: event.metadata
      }
    });

    return mapPrismaInteractionEvent(created);
  }
}
