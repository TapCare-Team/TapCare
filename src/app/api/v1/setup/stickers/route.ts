import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { createStickerForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sticker payload" }, { status: 400 });
  }

  try {
    const sticker = await createStickerForUser(user, parsed.data);
    return NextResponse.json(sticker, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Household not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create sticker" },
      { status: 400 }
    );
  }
}
