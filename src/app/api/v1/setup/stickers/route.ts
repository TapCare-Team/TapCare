import { NextResponse } from "next/server";
import { createStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { createSticker } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sticker payload" }, { status: 400 });
  }

  try {
    const sticker = await createSticker(parsed.data);
    return NextResponse.json(sticker, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create sticker" },
      { status: 400 }
    );
  }
}
