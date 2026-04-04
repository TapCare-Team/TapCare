import { NextResponse } from "next/server";
import { listHouseholdStickers } from "@/modules/stickers/services/sticker-setup.service";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  const stickers = await listHouseholdStickers(params.householdId);
  return NextResponse.json(stickers);
}
