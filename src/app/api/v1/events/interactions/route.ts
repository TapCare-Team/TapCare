import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { publicActionEventSchema } from "@/modules/analytics/contracts/event-contract";
import { recordPublicActionClick } from "@/modules/runtime/services/public-action-event.service";
import { isDomainError } from "@/modules/shared/errors";
import { analyticsMessages } from "@/modules/shared/messages";

const MAX_PUBLIC_ACTION_BODY_BYTES = 4 * 1024;

function hasJsonContentType(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().startsWith("application/json") ?? false;
}

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: analyticsMessages.invalidInteractionEventPayload }, { status: 400 });
  }

  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin interaction events are not allowed." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_PUBLIC_ACTION_BODY_BYTES) {
    return NextResponse.json({ error: analyticsMessages.invalidInteractionEventPayload }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_PUBLIC_ACTION_BODY_BYTES) {
      return NextResponse.json({ error: analyticsMessages.invalidInteractionEventPayload }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: analyticsMessages.invalidInteractionEventPayload }, { status: 400 });
  }

  const parsed = publicActionEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: analyticsMessages.invalidInteractionEventPayload, details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const event = await recordPublicActionClick(parsed.data);
    return NextResponse.json({ ok: true, eventId: event.id }, { status: 201 });
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    logger.warn("public_action_event_failed", {
      publicCode: parsed.data.publicCode,
      actionKey: parsed.data.actionKey,
      error: error instanceof Error ? error.message : "unknown"
    });
    return NextResponse.json({ error: "Interaction event could not be recorded" }, { status: 500 });
  }
}
