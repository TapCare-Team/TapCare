import { NextResponse } from "next/server";
import { followUpReviewRequestSchema } from "@/modules/households/contracts/review.contract";
import { getCurrentUser } from "@/lib/auth";
import { canReviewSignals } from "@/modules/auth/services/access-control.service";
import { logger } from "@/lib/logging/logger";

export async function POST(
  request: Request,
  { params }: { params: { signalId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canReviewSignals(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = followUpReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
  }

  logger.info("follow_up_signal_reviewed", {
    actorUserId: user.id,
    signalId: params.signalId,
    status: parsed.data.status
  });

  return NextResponse.json({
    ok: true,
    signalId: params.signalId,
    reviewerId: user.id,
    ...parsed.data
  });
}
