import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/modules/shared/errors";
import { commonMessages, signalMessages } from "@/modules/shared/messages";
import type { SessionUser } from "@/modules/auth/domain/access";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  reviewFollowUpSignal: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/modules/signals/services/follow-up-review.service", () => ({
  reviewFollowUpSignal: mocks.reviewFollowUpSignal
}));

import { POST } from "@/app/api/v1/officer/follow-up-signals/[signalId]/review/route";

function buildUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    displayName: "Officer One",
    role: "OFFICER",
    siteIds: ["site-1"],
    householdIds: [],
    ...overrides
  };
}

async function postReview(body: unknown, user: SessionUser | null = buildUser()) {
  mocks.getCurrentUser.mockResolvedValue(user);

  return POST(new Request("http://localhost/api/v1/officer/follow-up-signals/signal-1/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }), {
    params: { signalId: "signal-1" }
  });
}

describe("POST /api/v1/officer/follow-up-signals/[signalId]/review", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    const response = await postReview({ status: "REVIEWED" }, null);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: commonMessages.unauthorized });
  });

  it("returns 403 when the user cannot review signals", async () => {
    const response = await postReview({ status: "REVIEWED" }, buildUser({ role: "CAREGIVER" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: commonMessages.forbidden });
  });

  it("returns 400 when the payload is invalid", async () => {
    const response = await postReview({ status: "SNOOZED" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: signalMessages.invalidReviewPayload });
  });

  it("returns the service response when the review succeeds", async () => {
    mocks.reviewFollowUpSignal.mockResolvedValue({
      ok: true,
      signalId: "signal-1",
      reviewerId: "user-1",
      reviewedAt: "2025-04-10T09:00:00.000Z",
      status: "REVIEWED"
    });

    const response = await postReview({ status: "REVIEWED" });

    expect(mocks.reviewFollowUpSignal).toHaveBeenCalledWith(buildUser(), "signal-1", { status: "REVIEWED" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      signalId: "signal-1",
      reviewerId: "user-1",
      reviewedAt: "2025-04-10T09:00:00.000Z",
      status: "REVIEWED"
    });
  });

  it("maps domain errors to their status code and payload", async () => {
    mocks.reviewFollowUpSignal.mockRejectedValue(
      new NotFoundError(signalMessages.signalNotFound, "SIGNAL_NOT_FOUND")
    );

    const response = await postReview({ status: "REVIEWED" });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: signalMessages.signalNotFound,
      code: "SIGNAL_NOT_FOUND"
    });
  });

  it("maps unexpected errors to a 400 response", async () => {
    mocks.reviewFollowUpSignal.mockRejectedValue(new Error("DATABASE_URL is required for signal reviews"));

    const response = await postReview({ status: "REVIEWED" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "DATABASE_URL is required for signal reviews"
    });
  });

  it("returns forbidden domain errors from the service unchanged", async () => {
    mocks.reviewFollowUpSignal.mockRejectedValue(new ForbiddenError());

    const response = await postReview({ status: "REVIEWED" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: commonMessages.forbidden,
      code: "FORBIDDEN"
    });
  });
});
