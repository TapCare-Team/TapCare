import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { setStickerStatusForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  _request: Request,
  { params }: { params: { stickerId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sticker = await setStickerStatusForUser(user, params.stickerId, "ACTIVE");
    return NextResponse.json(sticker);
  } catch (error) {
    return toSetupRouteErrorResponse(error, "Unable to activate sticker");
  }
}
