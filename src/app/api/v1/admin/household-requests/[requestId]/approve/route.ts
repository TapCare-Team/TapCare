import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveHouseholdAccessRequestForAdmin } from "@/modules/households/services/household-access-request.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages } from "@/modules/shared/messages";

export async function POST(
  _request: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  try {
    const householdRequest = await approveHouseholdAccessRequestForAdmin(user, params.requestId);
    return NextResponse.json({ request: householdRequest });
  } catch (error) {
    return toHouseholdRouteErrorResponse(error, "Unable to approve household request.");
  }
}
