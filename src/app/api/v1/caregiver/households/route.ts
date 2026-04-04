import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCaregiverSurface } from "@/modules/auth/services/access-control.service";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessCaregiverSurface(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const households = (await getOfficerHouseholds(user.siteIds[0] ?? "site-sgo-bedok")).filter((household) =>
    user.householdIds.includes(household.id)
  );

  return NextResponse.json(households);
}
