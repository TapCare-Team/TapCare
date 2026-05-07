import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { createStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { createStickerForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createStickerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: setupMessages.invalidCreatePayload }, { status: 400 });
  }

  try {
    const sticker = await createStickerForUser(user, parsed.data);
    return NextResponse.json(sticker, { status: 201 });
  } catch (error) {
    return toSetupRouteErrorResponse(error, setupMessages.createFailed);
  }
}
