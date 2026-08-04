import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCaregiverSurface } from "@/modules/auth/services/access-control.service";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessCaregiverSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  const detail = await getHouseholdDetail(user, params.householdId);

  if (!detail) {
    return NextResponse.json({ error: householdMessages.householdNotFound }, { status: 404 });
  }

  return NextResponse.json(detail);
}
