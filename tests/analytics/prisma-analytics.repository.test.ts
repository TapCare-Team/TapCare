import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InteractionEvent } from "@/modules/analytics/domain/analytics";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  mapEvent: vi.fn((event) => event)
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction }
}));

vi.mock("@/modules/households/repositories/prisma-mappers", () => ({
  mapPrismaInteractionEvent: mocks.mapEvent
}));

describe("PrismaAnalyticsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        interactionEvent: { create: mocks.create },
        household: { updateMany: mocks.updateMany }
      })
    );
    mocks.create.mockResolvedValue({ id: "event-server-id" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("creates a sticker-open event and updates household activity in one transaction", async () => {
    const { PrismaAnalyticsRepository } = await import("@/modules/analytics/repositories/prisma-analytics.repository");
    const repository = new PrismaAnalyticsRepository();
    const event: InteractionEvent = {
      id: "event-server-id",
      occurredAt: "2026-08-16T12:00:00.000Z",
      siteId: "site-a",
      householdId: "household-a",
      stickerId: "sticker-a",
      eventType: "STICKER_OPENED",
      outcome: "SUCCESS"
    };

    await repository.createEvent(event);

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: "event-server-id", siteId: "site-a" }) })
    );
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "household-a" }) })
    );
  });
});
