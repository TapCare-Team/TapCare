import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessOfficerSurface } from "@/modules/auth/services/access-control.service";
import { getSignalsForSites } from "@/modules/households/services/household-analytics.service";
import { filterSignalsByReason, normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessOfficerSurface(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const reason = normalizeFollowUpReasonFilter(searchParams.get("reason") ?? undefined);
  const signals = await getSignalsForSites(user.siteIds);
  return NextResponse.json(filterSignalsByReason(signals, reason));
}
