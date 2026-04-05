import { NextResponse } from "next/server";
import { isDomainError } from "@/modules/shared/errors";

export function toSetupRouteErrorResponse(error: unknown, fallbackMessage: string) {
  if (isDomainError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage, code: "UNKNOWN_ERROR" },
    { status: 400 }
  );
}
