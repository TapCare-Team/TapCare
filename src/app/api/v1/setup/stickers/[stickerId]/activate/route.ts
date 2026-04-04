import { NextResponse } from "next/server";
import { updateSticker } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  _request: Request,
  { params }: { params: { stickerId: string } }
) {
  try {
    const sticker = await updateSticker(params.stickerId, { status: "ACTIVE" });
    if (!sticker) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }

    return NextResponse.json(sticker);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to activate sticker" },
      { status: 400 }
    );
  }
}
