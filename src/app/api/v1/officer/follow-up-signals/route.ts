import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessOfficerSurface } from "@/modules/auth/services/access-control.service";
import { getSignalsForSite } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessOfficerSurface(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signals = await getSignalsForSite(user.siteIds[0] ?? "site-sgo-bedok");
  return NextResponse.json(signals);
}
