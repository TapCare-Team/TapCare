import { NextResponse } from "next/server";
import { updateSticker } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  _request: Request,
  { params }: { params: { stickerId: string } }
) {
  const sticker = await updateSticker(params.stickerId, { status: "ACTIVE" });
  return NextResponse.json(sticker);
}
