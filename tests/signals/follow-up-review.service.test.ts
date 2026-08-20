import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/modules/shared/errors";
import type { SessionUser } from "@/modules/auth/domain/access";
import { signalMessages } from "@/modules/shared/messages";

const mocks = vi.hoisted(() => ({
  isDatabaseConfigured: vi.fn(),
  getFollowUpStateRepository: vi.fn()
}));

vi.mock("@/lib/db/database-mode", () => ({
  isDatabaseConfigured: mocks.isDatabaseConfigured
}));

vi.mock("@/modules/signals/repositories/follow-up-state.repository-provider", () => ({
  getFollowUpStateRepository: mocks.getFollowUpStateRepository
}));

import { reviewFollowUpSignal } from "@/modules/signals/services/follow-up-review.service";

function buildUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    displayName: "Admin One",
    role: "ADMIN",
    siteIds: [],
    householdIds: [],
    ...overrides
  };
}

describe("reviewFollowUpSignal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-10T09:00:00.000Z"));
    mocks.isDatabaseConfigured.mockReturnValue(true);
  });

  it("rejects reviews when the database is unavailable", async () => {
    mocks.isDatabaseConfigured.mockReturnValue(false);

    await expect(
      reviewFollowUpSignal(buildUser(), "signal-1", { status: "REVIEWED" })
    ).rejects.toThrow(signalMessages.databaseUnavailable);
  });

  it("returns not found when the signal state does not exist", async () => {
    mocks.getFollowUpStateRepository.mockReturnValue({
      getSignalStateById: vi.fn().mockResolvedValue(null)
    });

    await expect(
      reviewFollowUpSignal(buildUser(), "missing-signal", { status: "REVIEWED" })
    ).rejects.toEqual(new NotFoundError(signalMessages.signalNotFound, "SIGNAL_NOT_FOUND"));
  });

  it.each(["REVIEWED", "SNOOZED", "DISMISSED", "RESOLVED"] as const)(
    "rejects caregivers from %s even when assigned to the signal household",
    async (status) => {
    mocks.getFollowUpStateRepository.mockReturnValue({
      getSignalStateById: vi.fn().mockResolvedValue({
        id: "signal-1",
        householdId: "household-1",
        siteId: "site-1"
      })
    });

    await expect(
      reviewFollowUpSignal(
        buildUser({ role: "CAREGIVER", householdIds: ["household-1"], siteIds: [] }),
        "signal-1",
        { status }
      )
    ).rejects.toEqual(new ForbiddenError());
    }
  );

  it("persists a snoozed review with the expected mapped statuses", async () => {
    const applyReview = vi.fn().mockResolvedValue(undefined);
    mocks.getFollowUpStateRepository.mockReturnValue({
      getSignalStateById: vi.fn().mockResolvedValue({
        id: "signal-1",
        householdId: "household-1",
        siteId: "site-1"
      }),
      applyReview
    });

    const result = await reviewFollowUpSignal(buildUser(), "signal-1", {
      status: "SNOOZED",
      note: "Retry next week",
      snoozedUntil: "2025-04-17T09:00:00.000Z"
    });

    expect(applyReview).toHaveBeenCalledWith({
      signalId: "signal-1",
      householdId: "household-1",
      reviewerId: "user-1",
      signalStatus: "REVIEWED",
      reviewStatus: "SNOOZED",
      note: "Retry next week",
      reviewedAt: "2025-04-10T09:00:00.000Z",
      snoozedUntil: "2025-04-17T09:00:00.000Z"
    });
    expect(result).toEqual({
      ok: true,
      signalId: "signal-1",
      reviewerId: "user-1",
      reviewedAt: "2025-04-10T09:00:00.000Z",
      status: "SNOOZED",
      note: "Retry next week",
      snoozedUntil: "2025-04-17T09:00:00.000Z"
    });
  });

  it("maps dismissed reviews to a closed review with dismissed signal status", async () => {
    const applyReview = vi.fn().mockResolvedValue(undefined);
    mocks.getFollowUpStateRepository.mockReturnValue({
      getSignalStateById: vi.fn().mockResolvedValue({
        id: "signal-1",
        householdId: "household-1",
        siteId: "site-1"
      }),
      applyReview
    });

    await reviewFollowUpSignal(buildUser(), "signal-1", {
      status: "DISMISSED",
      note: "False positive"
    });

    expect(applyReview).toHaveBeenCalledWith(
      expect.objectContaining({
        signalStatus: "DISMISSED",
        reviewStatus: "CLOSED",
        note: "False positive"
      })
    );
  });
});
