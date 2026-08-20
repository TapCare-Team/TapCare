import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commonMessages, setupMessages } from "@/modules/shared/messages";
import { toSetupRouteErrorResponse } from "@/modules/stickers/services/sticker-setup-route.service";
import { markStickerPhysicalTagTestedForUser, resetStickerPhysicalTagTestForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(_request: Request, { params }: { params: { stickerId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  try { return NextResponse.json(await markStickerPhysicalTagTestedForUser(user, params.stickerId)); }
  catch (error) { return toSetupRouteErrorResponse(error, setupMessages.updateFailed); }
}

export async function DELETE(_request: Request, { params }: { params: { stickerId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: commonMessages.unauthorized }, { status: 401 });
  try { return NextResponse.json(await resetStickerPhysicalTagTestForUser(user, params.stickerId)); }
  catch (error) { return toSetupRouteErrorResponse(error, setupMessages.updateFailed); }
}
