import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageHousehold } from "@/modules/auth/services/access-control.service";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { createStickerSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { createSticker } from "@/modules/stickers/services/sticker-setup.service";

const householdsRepository = new PrismaHouseholdsRepository();

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
    const household = await householdsRepository.getById(parsed.data.householdId);
    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }
    if (!canManageHousehold(user, household.id, household.siteId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sticker = await createSticker(parsed.data);
    return NextResponse.json(sticker, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create sticker" },
      { status: 400 }
    );
  }
}
