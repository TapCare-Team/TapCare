import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { setStickerStatusForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  _request: Request,
  { params }: { params: { stickerId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
    }
    const sticker = await setStickerStatusForUser(user, params.stickerId, "DISABLED");
    return NextResponse.json(sticker);
  } catch (error) {
    return toSetupRouteErrorResponse(error, setupMessages.disableFailed);
  }
}
