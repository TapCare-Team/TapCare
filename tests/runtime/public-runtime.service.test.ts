import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";

const mocks = vi.hoisted(() => ({
  getByPublicCode: vi.fn(),
  recordRuntimeEvent: vi.fn()
}));

vi.mock("@/modules/runtime/repositories/public-runtime.repository-provider", () => ({
  getPublicRuntimeRepositories: () => ({
    runtimeRepository: {
      getByPublicCode: mocks.getByPublicCode
    }
  })
}));

vi.mock("@/modules/runtime/services/runtime-event.service", () => ({
  recordRuntimeEvent: mocks.recordRuntimeEvent
}));

import { resolvePublicRuntime } from "@/modules/runtime/services/public-runtime.service";

function runtimeRecord(overrides: Partial<RuntimeRecord["sticker"]> = {}): RuntimeRecord {
  return {
    household: {
      id: "household-1",
      siteId: "site-sgo-bedok",
      displayAddress: "Blk 1 Bedok"
    },
    sticker: {
      id: "sticker-1",
      name: "Emergency contact",
      publicCode: "public-code-1",
      stickerType: "EMERGENCY_CONTACT",
      runtimeMode: "DIRECT_REDIRECT",
      status: "ACTIVE",
      destination: {
        type: "PHONE",
        value: "+6591234567"
      },
      ...overrides
    }
  };
}

describe("resolvePublicRuntime analytics events", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.recordRuntimeEvent.mockResolvedValue(undefined);
  });

  it("records redirect events for direct redirect stickers", async () => {
    const record = runtimeRecord();
    mocks.getByPublicCode.mockResolvedValue(record);

    const resolution = await resolvePublicRuntime("public-code-1");

    expect(resolution.kind).toBe("DIRECT_REDIRECT");
    expect(mocks.recordRuntimeEvent).toHaveBeenNthCalledWith(1, {
      publicCode: "public-code-1",
      household: record.household,
      sticker: record.sticker,
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS"
    });
    expect(mocks.recordRuntimeEvent).toHaveBeenNthCalledWith(2, {
      publicCode: "public-code-1",
      household: record.household,
      sticker: record.sticker,
      eventType: "REDIRECT_ISSUED",
      outcome: "SUCCESS",
      destinationType: "PHONE"
    });
  });

  it("records rendered page events for TapCare page stickers", async () => {
    const record = runtimeRecord({
      stickerType: "HELP_PROFILE",
      runtimeMode: "RENDER_PAGE",
      destination: undefined,
      page: {
        pageType: "HELP_PROFILE",
        title: "Help profile",
        content: {
          helpFields: [{ label: "Safe return", value: "Call caregiver" }]
        }
      }
    });
    mocks.getByPublicCode.mockResolvedValue(record);

    const resolution = await resolvePublicRuntime("public-code-1");

    expect(resolution.kind).toBe("RENDER_PAGE");
    expect(mocks.recordRuntimeEvent).toHaveBeenNthCalledWith(1, {
      publicCode: "public-code-1",
      household: record.household,
      sticker: record.sticker,
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS"
    });
    expect(mocks.recordRuntimeEvent).toHaveBeenNthCalledWith(2, {
      publicCode: "public-code-1",
      household: record.household,
      sticker: record.sticker,
      eventType: "PAGE_RENDERED",
      outcome: "SUCCESS"
    });
  });
});
