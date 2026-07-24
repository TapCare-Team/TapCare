import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  createEvent: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured
}));

vi.mock("@/modules/analytics/repositories/prisma-analytics.repository", () => ({
  PrismaAnalyticsRepository: class {
    createEvent = mocks.createEvent;
  }
}));

vi.mock("@/modules/analytics/repositories/mock-analytics.repository", () => ({
  MockAnalyticsRepository: class {
    createEvent = mocks.createEvent;
  }
}));

import { POST } from "@/app/api/v1/events/interactions/route";

function postInteraction(body: unknown) {
  return POST(
    new Request("http://localhost/api/v1/events/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
  );
}

describe("POST /api/v1/events/interactions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isDatabaseConfigured.mockReturnValue(true);
    mocks.createEvent.mockResolvedValue(undefined);
  });

  it("persists valid interaction events for admin analytics", async () => {
    const response = await postInteraction({
      eventId: "event-1",
      occurredAt: "2026-07-24T01:00:00.000Z",
      siteId: "site-sgo-bedok",
      householdId: "household-1",
      stickerId: "sticker-1",
      publicCode: "abc123",
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS"
    });

    expect(mocks.createEvent).toHaveBeenCalledWith({
      id: "event-1",
      occurredAt: "2026-07-24T01:00:00.000Z",
      siteId: "site-sgo-bedok",
      householdId: "household-1",
      seniorProfileId: undefined,
      stickerId: "sticker-1",
      publicCode: "abc123",
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS",
      destinationType: undefined,
      failureReason: undefined,
      sessionTokenHash: undefined,
      metadata: undefined
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, eventId: "event-1" });
  });

  it("rejects invalid payloads without recording them", async () => {
    const response = await postInteraction({
      eventId: "event-1",
      occurredAt: "not-a-date",
      siteId: "site-sgo-bedok",
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS"
    });

    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it("returns a server error when a valid event cannot be recorded", async () => {
    mocks.createEvent.mockRejectedValue(new Error("write failed"));

    const response = await postInteraction({
      eventId: "event-1",
      occurredAt: "2026-07-24T01:00:00.000Z",
      siteId: "site-sgo-bedok",
      eventType: "STICKER_OPENED",
      outcome: "FAILED",
      failureReason: "INVALID_CODE"
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Interaction event could not be recorded" });
  });
});
