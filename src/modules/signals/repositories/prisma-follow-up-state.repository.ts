import { prisma } from "@/lib/db/prisma";
import type { FollowUpSignal, FollowUpReviewState } from "@/modules/signals/domain/follow-up-signal";

type PersistedFollowUpSignalState = Pick<
  FollowUpSignal,
  "id" | "householdId" | "siteId" | "signalType" | "status" | "firstObservedAt" | "lastObservedAt"
>;

type CreateFollowUpReviewInput = {
  signalId: string;
  householdId: string;
  reviewerId: string;
  signalStatus: FollowUpSignal["status"];
  reviewStatus: "REVIEWED" | "SNOOZED" | "CLOSED";
  note?: string;
  reviewedAt: string;
  snoozedUntil?: string;
};

function toPersistedSignalState(
  signal: Awaited<ReturnType<typeof prisma.followUpSignal.findFirstOrThrow>>
): PersistedFollowUpSignalState {
  return {
    id: signal.id,
    householdId: signal.householdId,
    siteId: signal.siteId,
    signalType: signal.signalType,
    status: signal.status,
    firstObservedAt: signal.firstObservedAt.toISOString(),
    lastObservedAt: signal.lastObservedAt.toISOString()
  };
}

function toReviewState(
  review: Awaited<ReturnType<typeof prisma.followUpReview.findFirstOrThrow>>
): FollowUpReviewState {
  if (review.status === "SNOOZED") {
    return {
      status: "SNOOZED",
      note: review.note ?? undefined,
      reviewedAt: review.reviewedAt?.toISOString(),
      snoozedUntil: review.snoozedUntil?.toISOString()
    };
  }

  return {
    status: "REVIEWED",
    note: review.note ?? undefined,
    reviewedAt: review.reviewedAt?.toISOString()
  };
}

export class PrismaFollowUpStateRepository {
  async syncDerivedSignals(signals: FollowUpSignal[]) {
    if (signals.length === 0) {
      return;
    }

    const existingSignals = await prisma.followUpSignal.findMany({
      where: {
        id: { in: signals.map((signal) => signal.id) }
      }
    });
    const existingById = new Map(existingSignals.map((signal) => [signal.id, signal]));

    await prisma.$transaction(
      signals.map((signal) => {
        const existing = existingById.get(signal.id);
        const hasNewerObservation =
          !existing || new Date(signal.lastObservedAt).getTime() > existing.lastObservedAt.getTime();
        const nextStatus = hasNewerObservation ? "ACTIVE" : existing.status;

        return prisma.followUpSignal.upsert({
          where: { id: signal.id },
          create: {
            id: signal.id,
            householdId: signal.householdId,
            siteId: signal.siteId,
            signalType: signal.signalType,
            status: nextStatus,
            firstObservedAt: new Date(signal.firstObservedAt),
            lastObservedAt: new Date(signal.lastObservedAt),
            explanation: signal.explanation,
            evidence: signal.evidence
          },
          update: {
            householdId: signal.householdId,
            siteId: signal.siteId,
            signalType: signal.signalType,
            status: nextStatus,
            firstObservedAt: new Date(signal.firstObservedAt),
            lastObservedAt: new Date(signal.lastObservedAt),
            explanation: signal.explanation,
            evidence: signal.evidence
          }
        });
      })
    );
  }

  async listSignalStatesByIds(signalIds: string[]) {
    if (signalIds.length === 0) {
      return [];
    }

    const signals = await prisma.followUpSignal.findMany({
      where: {
        id: { in: signalIds }
      }
    });

    return signals.map(toPersistedSignalState);
  }

  async getSignalStateById(signalId: string) {
    const signal = await prisma.followUpSignal.findUnique({
      where: { id: signalId }
    });

    return signal ? toPersistedSignalState(signal) : null;
  }

  async listLatestReviewsBySignalIds(signalIds: string[]) {
    if (signalIds.length === 0) {
      return [];
    }

    const reviews = await prisma.followUpReview.findMany({
      where: {
        signalId: { in: signalIds }
      },
      orderBy: [{ signalId: "asc" }, { reviewedAt: "desc" }],
      distinct: ["signalId"]
    });

    return reviews.map((review) => ({
      signalId: review.signalId!,
      review: toReviewState(review)
    }));
  }

  async applyReview(input: CreateFollowUpReviewInput) {
    await prisma.$transaction([
      prisma.followUpSignal.update({
        where: { id: input.signalId },
        data: {
          status: input.signalStatus
        }
      }),
      prisma.followUpReview.create({
        data: {
          householdId: input.householdId,
          signalId: input.signalId,
          reviewerId: input.reviewerId,
          status: input.reviewStatus,
          note: input.note,
          reviewedAt: new Date(input.reviewedAt),
          snoozedUntil: input.snoozedUntil ? new Date(input.snoozedUntil) : undefined
        }
      })
    ]);
  }
}
