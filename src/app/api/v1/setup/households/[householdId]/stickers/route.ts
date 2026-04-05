import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { listHouseholdStickersForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
    }

    const stickers = await listHouseholdStickersForUser(user, params.householdId);
    return NextResponse.json(stickers);
  } catch (error) {
    return toSetupRouteErrorResponse(error, setupMessages.listFailed);
  }
}
