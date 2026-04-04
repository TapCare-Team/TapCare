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

  const sticker = await updateSticker(params.stickerId, parsed.data);
  return NextResponse.json(sticker);
}
