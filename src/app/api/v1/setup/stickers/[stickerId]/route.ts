import { NextResponse } from "next/server";
import { updateStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { updateSticker } from "@/modules/stickers/services/sticker-setup.service";

export async function PATCH(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const body = await request.json();
  const parsed = updateStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sticker update payload" }, { status: 400 });
  }

  try {
    const sticker = await updateSticker(params.stickerId, parsed.data);
    if (!sticker) {
      return NextResponse.json({ error: "Sticker not found" }, { status: 404 });
    }

    return NextResponse.json(sticker);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update sticker" },
      { status: 400 }
    );
  }
}
