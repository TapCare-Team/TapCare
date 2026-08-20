import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { DomainError } from "@/modules/shared/errors";

const mocks = vi.hoisted(() => ({
  getByPublicCode: vi.fn(),
  createEvent: vi.fn()
}));

vi.mock("@/modules/runtime/repositories/public-runtime.repository-provider", () => ({
  getPublicRuntimeRepositories: () => ({
    runtimeRepository: { getByPublicCode: mocks.getByPublicCode },
    eventsRepository: { createEvent: mocks.createEvent }
  })
}));

import { recordPublicActionClick } from "@/modules/runtime/services/public-action-event.service";

function runtimeRecord(overrides: Partial<RuntimeRecord["sticker"]> = {}): RuntimeRecord {
  return {
    household: { id: "household-a", siteId: "site-a", displayAddress: "Blk 1 Bedok" },
    sticker: {
      id: "sticker-a",
      name: "Contact support",
      publicCode: "abc123",
      stickerType: "EMERGENCY_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      status: "ACTIVE",
      destination: { type: "PHONE", value: "+6591234567" },
      ...overrides
    }
  };
}

describe("recordPublicActionClick", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00.000Z"));
    vi.resetAllMocks();
    mocks.createEvent.mockResolvedValue(undefined);
  });

  it("derives identity, event type, outcome, id, and timestamp on the server", async () => {
    mocks.getByPublicCode.mockResolvedValue(runtimeRecord());

    const event = await recordPublicActionClick({ publicCode: " ABC123 ", actionKey: "call" });

    expect(mocks.getByPublicCode).toHaveBeenCalledWith("abc123");
    expect(mocks.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-a",
        householdId: "household-a",
        stickerId: "sticker-a",
        publicCode: "abc123",
        eventType: "PAGE_ACTION_CLICKED",
        outcome: "SUCCESS",
        destinationType: "PHONE",
        metadata: { actionKey: "call" },
        occurredAt: "2026-08-16T12:00:00.000Z",
        id: expect.any(String)
      })
    );
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("accepts external link clicks for resource pages", async () => {
    mocks.getByPublicCode.mockResolvedValue(
      runtimeRecord({
        runtimeMode: "RENDER_PAGE",
        destination: undefined,
        page: {
          pageType: "RESOURCES",
          title: "Resources",
          content: { links: [{ label: "Agency", href: "https://agency.example" }] }
        }
      })
    );

    await recordPublicActionClick({ publicCode: "abc123", actionKey: "open_link" });

    expect(mocks.createEvent).toHaveBeenCalledWith(expect.objectContaining({ destinationType: "EXTERNAL_URL" }));
  });

  it("rejects incompatible actions without recording an event", async () => {
    mocks.getByPublicCode.mockResolvedValue(runtimeRecord());

    await expect(recordPublicActionClick({ publicCode: "abc123", actionKey: "open_link" })).rejects.toEqual(
      new DomainError("This action is not available for the selected sticker.", 422, "PUBLIC_ACTION_NOT_AVAILABLE")
    );
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects phone actions for resource pages", async () => {
    mocks.getByPublicCode.mockResolvedValue(
      runtimeRecord({
        runtimeMode: "RENDER_PAGE",
        destination: undefined,
        page: {
          pageType: "RESOURCES",
          title: "Resources",
          content: { links: [{ label: "Agency", href: "https://agency.example" }] }
        }
      })
    );

    await expect(recordPublicActionClick({ publicCode: "abc123", actionKey: "call" })).rejects.toMatchObject({
      code: "PUBLIC_ACTION_NOT_AVAILABLE"
    });
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects disabled stickers without recording an event", async () => {
    mocks.getByPublicCode.mockResolvedValue(runtimeRecord({ status: "DISABLED" }));

    await expect(recordPublicActionClick({ publicCode: "abc123", actionKey: "call" })).rejects.toMatchObject({
      statusCode: 410,
      code: "PUBLIC_STICKER_DISABLED"
    });
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("propagates persistence failures for public action clicks", async () => {
    mocks.getByPublicCode.mockResolvedValue(runtimeRecord());
    mocks.createEvent.mockRejectedValue(new Error("database unavailable"));

    await expect(recordPublicActionClick({ publicCode: "abc123", actionKey: "call" })).rejects.toThrow(
      "database unavailable"
    );
  });
});
