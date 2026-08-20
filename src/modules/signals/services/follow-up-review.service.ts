import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { SessionUser } from "@/modules/auth/domain/access";
import { canReviewSignal } from "@/modules/auth/services/access-control.service";
import type { FollowUpReviewRequest } from "@/modules/households/contracts/review.contract";
import { ConfigurationError, ForbiddenError, NotFoundError } from "@/modules/shared/errors";
import { signalMessages } from "@/modules/shared/messages";
import { getFollowUpStateRepository } from "@/modules/signals/repositories/follow-up-state.repository-provider";

export async function reviewFollowUpSignal(user: SessionUser, signalId: string, input: FollowUpReviewRequest) {
  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(signalMessages.databaseUnavailable, "SIGNAL_REVIEW_DATABASE_UNAVAILABLE");
  }

  if (!canReviewSignal(user)) {
    throw new ForbiddenError();
  }

  const repository = getFollowUpStateRepository();
  const signal = await repository.getSignalStateById(signalId);
  if (!signal) {
    throw new NotFoundError(signalMessages.signalNotFound, "SIGNAL_NOT_FOUND");
  }

  const reviewedAt = new Date().toISOString();
  const reviewStatusByRequestStatus = {
    SNOOZED: "SNOOZED",
    REVIEWED: "REVIEWED",
    DISMISSED: "CLOSED",
    RESOLVED: "CLOSED"
  } as const;
  const signalStatusByRequestStatus = {
    SNOOZED: "REVIEWED",
    REVIEWED: "REVIEWED",
    DISMISSED: "DISMISSED",
    RESOLVED: "RESOLVED"
  } as const;

  const reviewStatus = reviewStatusByRequestStatus[input.status];
  const signalStatus = signalStatusByRequestStatus[input.status];

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
