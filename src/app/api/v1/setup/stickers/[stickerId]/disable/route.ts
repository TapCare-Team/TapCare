import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageHousehold } from "@/modules/auth/services/access-control.service";
import { getStickerScope, updateSticker } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  _request: Request,
  { params }: { params: { stickerId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getStickerScope(params.stickerId);
    if (!scope) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }
    if (!canManageHousehold(user, scope.householdId, scope.siteId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sticker = await updateSticker(params.stickerId, { status: "DISABLED" });
    if (!sticker) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }

    return NextResponse.json(sticker);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to disable sticker" },
      { status: 400 }
    );
  }
}
