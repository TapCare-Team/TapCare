import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { requestHouseholdAccessSchema } from "@/modules/households/contracts/household-access-request.contract";
import { createHouseholdAccessRequestForCaregiver } from "@/modules/households/services/household-access-request.service";
import { toHouseholdRouteErrorResponse } from "@/modules/households/services/household-route.service";
import { commonMessages } from "@/modules/shared/messages";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  try {
    const payload = requestHouseholdAccessSchema.parse(await request.json());
    const householdRequest = await createHouseholdAccessRequestForCaregiver(user, payload);
    return NextResponse.json({ request: householdRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Please check the household request and try again.",
          code: "INVALID_HOUSEHOLD_REQUEST_PAYLOAD"
        },
        { status: 400 }
      );
    }

    return toHouseholdRouteErrorResponse(error, "Unable to request household access.");
  }
}
