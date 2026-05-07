import { NextResponse } from "next/server";
import { interactionEventSchema } from "@/modules/analytics/contracts/event-contract";
import { logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = interactionEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid interaction event payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  logger.info("interaction_event_received", {
    siteId: parsed.data.siteId,
    eventType: parsed.data.eventType,
    outcome: parsed.data.outcome
  });

  return NextResponse.json({ ok: true, normalizedEvent: parsed.data }, { status: 201 });
}
