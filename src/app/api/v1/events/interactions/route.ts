import { NextResponse } from "next/server";
import { interactionEventSchema } from "@/modules/analytics/contracts/event-contract";
import { logger } from "@/lib/logging/logger";
import { getDataMode } from "@/lib/db/database-mode";
import { MockAnalyticsRepository } from "@/modules/analytics/repositories/mock-analytics.repository";
import { PrismaAnalyticsRepository } from "@/modules/analytics/repositories/prisma-analytics.repository";
import { analyticsMessages } from "@/modules/shared/messages";

const mockAnalyticsRepository = new MockAnalyticsRepository();
const prismaAnalyticsRepository = new PrismaAnalyticsRepository();

function getEventsRepository() {
  return getDataMode() === "database" ? prismaAnalyticsRepository : mockAnalyticsRepository;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = interactionEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: analyticsMessages.invalidInteractionEventPayload, details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const event = {
    id: parsed.data.eventId,
    occurredAt: parsed.data.occurredAt,
    siteId: parsed.data.siteId,
    householdId: parsed.data.householdId,
    seniorProfileId: parsed.data.seniorProfileId,
    stickerId: parsed.data.stickerId,
    publicCode: parsed.data.publicCode,
    stickerType: parsed.data.stickerType,
    runtimeMode: parsed.data.runtimeMode,
    eventType: parsed.data.eventType,
    outcome: parsed.data.outcome,
    destinationType: parsed.data.destinationType,
    failureReason: parsed.data.failureReason,
    sessionTokenHash: parsed.data.sessionTokenHash,
    metadata: parsed.data.metadata
  };

  try {
    await getEventsRepository().createEvent(event);
  } catch (error) {
    logger.warn("interaction_event_persist_failed", {
      eventId: event.id,
      siteId: event.siteId,
      eventType: event.eventType,
      error: error instanceof Error ? error.message : "unknown"
    });

    return NextResponse.json({ error: "Interaction event could not be recorded" }, { status: 500 });
  }

  logger.info("interaction_event_received", {
    siteId: parsed.data.siteId,
    eventType: parsed.data.eventType,
    outcome: parsed.data.outcome
  });

  return NextResponse.json({ ok: true, eventId: event.id }, { status: 201 });
}
