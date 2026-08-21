import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unassignCaregiverFromHouseholdForUser } from "@/modules/households/services/household-management.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function DELETE(_request: Request, { params }: { params: { householdId: string; caregiverId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  try {
    await unassignCaregiverFromHouseholdForUser(user, params.householdId, params.caregiverId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, householdMessages.assignCaregiverFailed);
  }
}
