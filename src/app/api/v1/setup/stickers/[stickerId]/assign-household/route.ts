import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { assignStickerHouseholdSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { assignStickerToHouseholdForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assignStickerHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: setupMessages.invalidAssignPayload }, { status: 400 });
  }

  try {
    const sticker = await assignStickerToHouseholdForUser(user, params.stickerId, parsed.data.householdId);
    return NextResponse.json(sticker);
  } catch (error) {
    return toSetupRouteErrorResponse(error, setupMessages.assignFailed);
  }
}
