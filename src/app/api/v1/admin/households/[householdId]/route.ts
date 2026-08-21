import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";
import { deleteHouseholdForUser } from "@/modules/households/services/household-management.service";
import { updateHouseholdForUser } from "@/modules/households/services/household-management.service";
import { updateHouseholdSchema } from "@/modules/households/contracts/household-update.contract";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessAdminSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  const detail = await getHouseholdDetail(user, params.householdId);

  if (!detail) {
    return NextResponse.json({ error: householdMessages.householdNotFound }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, { params }: { params: { householdId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  const parsed = updateHouseholdSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid household address." }, { status: 400 });
  try { return NextResponse.json(await updateHouseholdForUser(user, params.householdId, parsed.data)); }
  catch (error) { return toHouseholdRouteErrorResponse(error, "Unable to update household."); }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  try {
    await deleteHouseholdForUser(user, params.householdId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, householdMessages.deleteFailed);
  }
}
