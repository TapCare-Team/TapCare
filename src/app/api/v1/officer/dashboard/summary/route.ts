import { NextResponse } from "next/server";
import { getOfficerDashboardSummary } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const summary = await getOfficerDashboardSummary("site-sgo-bedok");
  return NextResponse.json(summary);
}
