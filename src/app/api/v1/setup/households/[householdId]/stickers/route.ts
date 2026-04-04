import { NextResponse } from "next/server";
import { listHouseholdStickers } from "@/modules/stickers/services/sticker-setup.service";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  try {
    const stickers = await listHouseholdStickers(params.householdId);
    return NextResponse.json(stickers);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list stickers" },
      { status: 400 }
    );
  }
}
