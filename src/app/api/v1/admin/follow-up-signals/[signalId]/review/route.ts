import { NextResponse } from "next/server";
import { followUpReviewRequestSchema } from "@/modules/households/contracts/review.contract";
import { getCurrentUser } from "@/lib/auth";
import { canReviewSignal } from "@/modules/auth/services/access-control.service";
import { commonMessages, signalMessages } from "@/modules/shared/messages";
import { isDomainError } from "@/modules/shared/errors";
import { reviewFollowUpSignal } from "@/modules/signals/services/follow-up-review.service";

export async function POST(
  request: Request,
  { params }: { params: { signalId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canReviewSignal(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  const body = await request.json();
  const parsed = followUpReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: signalMessages.invalidReviewPayload }, { status: 400 });
  }

  try {
    const result = await reviewFollowUpSignal(user, params.signalId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: signalMessages.reviewFailed },
      { status: 400 }
    );
  }
}
