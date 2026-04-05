import { NextResponse } from "next/server";
import { followUpReviewRequestSchema } from "@/modules/households/contracts/review.contract";
import { getCurrentUser } from "@/lib/auth";
import { canReviewSignals } from "@/modules/auth/services/access-control.service";
import { reviewFollowUpSignal } from "@/modules/signals/services/follow-up-review.service";

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

  try {
    const result = await reviewFollowUpSignal(user, params.signalId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Signal not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to review follow-up signal" },
      { status: 400 }
    );
  }
}
