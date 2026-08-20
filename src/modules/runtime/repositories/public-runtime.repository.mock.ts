import { mockHouseholds } from "@/lib/mock-data";
import type { RuntimeRecord } from "@/modules/runtime/domain/public-runtime";
import { normalizePublicCode } from "@/modules/runtime/services/public-code.service";

export class MockPublicRuntimeRepository {
  async getByPublicCode(publicCode: string): Promise<RuntimeRecord | null> {
    const normalized = normalizePublicCode(publicCode);
    const household = mockHouseholds.find((candidate) =>
      candidate.stickers.some((sticker) => sticker.publicCode === normalized)
    );

    if (!household) {
      return null;
    }

    const sticker = household.stickers.find((candidate) => candidate.publicCode === normalized);
    if (!sticker) {
      return null;
    }

    return {
      household: {
        id: household.id,
        siteId: household.siteId,
        displayAddress: household.displayAddress
      },
      sticker
    };
  }
}
