import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assignStickerHouseholdSchema } from "@/modules/stickers/contracts/sticker-setup.contract";
import { assignStickerToHouseholdForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function POST(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assignStickerHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assign payload" }, { status: 400 });
  }

  try {
    const sticker = await assignStickerToHouseholdForUser(user, params.stickerId, parsed.data.householdId);
    return NextResponse.json(sticker);
  } catch (error) {
    if (error instanceof Error && (error.message === "Household not found" || error.message === "Sticker not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to assign sticker" },
      { status: 400 }
    );
  }
}
