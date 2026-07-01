import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import { getAdminHouseholds } from "@/modules/households/services/household-analytics.service";
import { createHouseholdSchema } from "@/modules/households/contracts/household-create.contract";
import { createHouseholdForUser } from "@/modules/households/services/household-management.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessAdminSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  const households = await getAdminHouseholds();
  return NextResponse.json(households);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessAdminSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  try {
    const payload = createHouseholdSchema.parse(await request.json());
    const household = await createHouseholdForUser(user, payload);
    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, householdMessages.createFailed);
  }
}
