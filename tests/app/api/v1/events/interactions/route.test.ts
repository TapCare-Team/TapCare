import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError, NotFoundError } from "@/modules/shared/errors";

const mocks = vi.hoisted(() => ({
  recordPublicActionClick: vi.fn()
}));

vi.mock("@/modules/runtime/services/public-action-event.service", () => ({
  recordPublicActionClick: mocks.recordPublicActionClick
}));

import { POST } from "@/app/api/v1/events/interactions/route";

function postInteraction(body: string, headers: HeadersInit = { "Content-Type": "application/json" }) {
  return POST(
    new Request("http://localhost/api/v1/events/interactions", {
      method: "POST",
      headers,
      body
    })
  );
}

describe("POST /api/v1/events/interactions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.recordPublicActionClick.mockResolvedValue({ id: "server-event-1" });
  });

  it("records a valid narrow public action payload", async () => {
    const response = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link" }));

    expect(mocks.recordPublicActionClick).toHaveBeenCalledWith({ publicCode: "abc123", actionKey: "open_link" });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, eventId: "server-event-1" });
  });

  it("rejects a forged sticker-open event before it reaches the service", async () => {
    const response = await postInteraction(
      JSON.stringify({
        publicCode: "abc123",
        actionKey: "open_link",
        eventType: "STICKER_OPENED",
        siteId: "site-target",
        householdId: "household-target",
        occurredAt: "2099-01-01T00:00:00.000Z"
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.recordPublicActionClick).not.toHaveBeenCalled();
  });

  it("rejects invalid action keys", async () => {
    const response = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "mark_household_active" }));

    expect(response.status).toBe(400);
    expect(mocks.recordPublicActionClick).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await postInteraction("{bad json");

    expect(response.status).toBe(400);
    expect(mocks.recordPublicActionClick).not.toHaveBeenCalled();
  });

  it("maps unknown stickers to not found", async () => {
    mocks.recordPublicActionClick.mockRejectedValue(new NotFoundError("Public sticker could not be found.", "PUBLIC_STICKER_NOT_FOUND"));

    const response = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link" }));

    expect(response.status).toBe(404);
  });

  it("maps disabled stickers to gone", async () => {
    mocks.recordPublicActionClick.mockRejectedValue(
      new DomainError("This TapCare sticker is currently disabled.", 410, "PUBLIC_STICKER_DISABLED")
    );

    const response = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link" }));

    expect(response.status).toBe(410);
  });

  it("requires JSON and rejects cross-origin requests", async () => {
    const nonJsonResponse = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link" }), {
      "Content-Type": "text/plain"
    });
    const crossOriginResponse = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link" }), {
      "Content-Type": "application/json",
      Origin: "https://other.example"
    });

    expect(nonJsonResponse.status).toBe(400);
    expect(crossOriginResponse.status).toBe(403);
    expect(mocks.recordPublicActionClick).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies", async () => {
    const response = await postInteraction(JSON.stringify({ publicCode: "abc123", actionKey: "open_link", padding: "x".repeat(4096) }));

    expect(response.status).toBe(413);
    expect(mocks.recordPublicActionClick).not.toHaveBeenCalled();
  });
});
