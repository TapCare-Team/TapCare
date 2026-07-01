import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assignCaregiverSchema } from "@/modules/households/contracts/household-caregiver-assignment.contract";
import { assignCaregiverToHouseholdForUser } from "@/modules/households/services/household-management.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages, householdMessages } from "@/modules/shared/messages";

export async function POST(
  request: Request,
  { params }: { params: { householdId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assignCaregiverSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check the caregiver email and try again.",
        code: "INVALID_CAREGIVER_ASSIGNMENT_PAYLOAD"
      },
      { status: 400 }
    );
  }

  try {
    const result = await assignCaregiverToHouseholdForUser(user, params.householdId, parsed.data);
    return NextResponse.json({
      caregiver: result.caregiver,
      alreadyAssigned: result.alreadyAssigned,
      household: result.household
    });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, householdMessages.assignCaregiverFailed);
  }
}
