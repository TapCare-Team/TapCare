import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDomainError } from "@/modules/shared/errors";

function friendlyValidationMessage(error: ZodError) {
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return "Please check the household details and try again.";
  }

  return firstIssue.message;
}

export function toHouseholdRouteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: friendlyValidationMessage(error), code: "INVALID_HOUSEHOLD_PAYLOAD" },
      { status: 400 }
    );
  }

  if (isDomainError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage, code: "UNKNOWN_ERROR" },
    { status: 400 }
  );
}
