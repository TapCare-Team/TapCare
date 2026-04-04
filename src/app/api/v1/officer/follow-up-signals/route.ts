import { NextResponse } from "next/server";
import { getSignalsForSite } from "@/modules/households/services/household-analytics.service";

export async function GET() {
  const signals = await getSignalsForSite("site-sgo-bedok");
  return NextResponse.json(signals);
}
