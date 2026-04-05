import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
    if (error instanceof Error && error.message === "Sticker not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to activate sticker" },
      { status: 400 }
    );
  }
}
