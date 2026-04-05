import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessOfficerSurface } from "@/modules/auth/services/access-control.service";
import { createHouseholdSchema } from "@/modules/households/contracts/household-create.contract";
import { findDuplicateHouseholdForUser } from "@/modules/households/services/household-management.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }
  if (!canAccessOfficerSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  try {
    const payload = createHouseholdSchema.parse(await request.json());
    const duplicate = await findDuplicateHouseholdForUser(user, payload);

    return NextResponse.json({
      duplicate: duplicate
        ? {
            id: duplicate.id,
            displayAddress: duplicate.displayAddress,
            siteName: duplicate.siteName
          }
        : null
    });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, householdMessages.duplicateCheckFailed);
  }
}
