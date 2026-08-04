import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCaregiverSurface } from "@/modules/auth/services/access-control.service";
import { getHouseholdsByIds } from "@/modules/households/services/household-analytics.service";
import { commonMessages } from "@/modules/shared/messages";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessCaregiverSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  const households = await getHouseholdsByIds(user.householdIds);

  return NextResponse.json({
    assignedHouseholds: households.length,
    householdsWithSignals: households.filter((household) => household.signal).length
  });
}
