import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canViewHousehold } from "@/modules/auth/services/access-control.service";
import type { FollowUpReviewRequest } from "@/modules/households/contracts/review.contract";
import { ForbiddenError, NotFoundError } from "@/modules/shared/errors";
import { signalMessages } from "@/modules/shared/messages";
import { getFollowUpStateRepository } from "@/modules/signals/repositories/follow-up-state.repository-provider";

export async function reviewFollowUpSignal(user: SessionUser, signalId: string, input: FollowUpReviewRequest) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for signal reviews");
  }

  const repository = getFollowUpStateRepository();
  const signal = await repository.getSignalStateById(signalId);
  if (!signal) {
    throw new NotFoundError(signalMessages.signalNotFound, "SIGNAL_NOT_FOUND");
  }

  if (!canViewHousehold(user, signal.householdId, signal.siteId)) {
    throw new ForbiddenError();
  }

  const reviewedAt = new Date().toISOString();

  const reviewStatus =
    input.status === "SNOOZED" ? "SNOOZED" : input.status === "REVIEWED" ? "REVIEWED" : "CLOSED";
  const signalStatus =
    input.status === "DISMISSED"
      ? "DISMISSED"
      : input.status === "RESOLVED"
        ? "RESOLVED"
        : input.status === "REVIEWED"
          ? "REVIEWED"
          : "REVIEWED";

  await repository.applyReview({
    signalId,
    householdId: signal.householdId,
    reviewerId: user.id,
    signalStatus,
    reviewStatus,
    note: input.note,
    reviewedAt,
    snoozedUntil: input.snoozedUntil
  });

  return {
    ok: true,
    signalId,
    reviewerId: user.id,
    reviewedAt,
    ...input
  };
}
