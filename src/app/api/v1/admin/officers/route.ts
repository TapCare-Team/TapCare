import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assignOfficerSchema } from "@/modules/admin/contracts/officer-assignment.contract";
import { assignOfficerForAdmin } from "@/modules/admin/services/officer-assignment.service";
import { commonMessages } from "@/modules/shared/messages";
import { isDomainError } from "@/modules/shared/errors";

function toAdminRouteErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Please check the officer details and try again." },
      { status: 400 }
    );
  }

  if (isDomainError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }

  return NextResponse.json({ error: "Unable to assign officer." }, { status: 400 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  try {
    const payload = assignOfficerSchema.parse(await request.json());
    const officer = await assignOfficerForAdmin(user, payload);
    return NextResponse.json({ officer }, { status: 201 });
  } catch (error) {
    return toAdminRouteErrorResponse(error);
  }
}
