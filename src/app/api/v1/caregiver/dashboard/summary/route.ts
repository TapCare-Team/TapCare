import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const user = await getCurrentUser("caregiver");
  const households = (await getOfficerHouseholds("site-sgo-bedok")).filter((household) =>
    user.householdIds.includes(household.id)
  );

  return NextResponse.json({
    assignedHouseholds: households.length,
    householdsWithSignals: households.filter((household) => household.signal).length
  });
}
