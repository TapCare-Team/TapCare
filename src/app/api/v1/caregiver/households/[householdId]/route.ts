import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  const user = await getCurrentUser("caregiver");
  const detail = await getHouseholdDetail(user, params.householdId);

  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
