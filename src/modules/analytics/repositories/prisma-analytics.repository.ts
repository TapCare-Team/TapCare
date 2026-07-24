import { prisma } from "@/lib/db/prisma";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { mapPrismaInteractionEvent } from "@/modules/households/repositories/prisma-mappers";

export class PrismaAnalyticsRepository {
  async listEvents() {
    const events = await prisma.interactionEvent.findMany({
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async listEventsSince(since: Date) {
    const events = await prisma.interactionEvent.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async listEventsBySiteIds(siteIds: string[]) {
    const events = await prisma.interactionEvent.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async listRecentEventsBySiteIds(siteIds: string[], since: Date) {
    const events = await prisma.interactionEvent.findMany({
      where: {
        siteId: { in: siteIds },
        occurredAt: { gte: since }
      },
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

  async listRecentEventsByHouseholdIds(householdIds: string[], since: Date) {
    const events = await prisma.interactionEvent.findMany({
      where: {
        householdId: { in: householdIds },
        occurredAt: { gte: since }
      },
      orderBy: { occurredAt: "desc" }
    });

    return events.map(mapPrismaInteractionEvent);
  }

  async createEvent(event: InteractionEvent) {
    const occurredAt = new Date(event.occurredAt);
    const created = await prisma.interactionEvent.create({
      data: {
        occurredAt,
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

    if (event.householdId && event.eventType === "STICKER_OPENED") {
      await prisma.household.updateMany({
        where: {
          id: event.householdId,
          OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: occurredAt } }]
        },
        data: { lastActiveAt: occurredAt }
      });
    }

    return mapPrismaInteractionEvent(created);
  }
}
