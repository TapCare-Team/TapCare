import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { updateStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { updateStickerForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function PATCH(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: setupMessages.invalidUpdatePayload }, { status: 400 });
  }

  try {
    const sticker = await updateStickerForUser(user, params.stickerId, parsed.data);
    return NextResponse.json(sticker);
  } catch (error) {
    return toSetupRouteErrorResponse(error, setupMessages.updateFailed);
  }
}
