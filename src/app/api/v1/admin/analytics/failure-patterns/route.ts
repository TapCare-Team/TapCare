import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminFailurePatterns } from "@/modules/analytics/services/admin-analytics.service";
import { canAccessAdminSurface } from "@/modules/auth/services/access-control.service";
import { commonMessages } from "@/modules/shared/messages";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  if (!canAccessAdminSurface(user)) {
    return NextResponse.json({ error: commonMessages.forbidden }, { status: 403 });
  }

  return NextResponse.json(await getAdminFailurePatterns(user));
}
