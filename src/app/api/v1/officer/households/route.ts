import { NextResponse } from "next/server";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const households = await getOfficerHouseholds("site-sgo-bedok");
  return NextResponse.json(households);
}
