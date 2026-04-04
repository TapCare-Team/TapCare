import { NextResponse } from "next/server";
import { z } from "zod";
import { assignStickerToHousehold } from "@/modules/stickers/services/sticker-setup.service";

const schema = z.object({ householdId: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assign payload" }, { status: 400 });
  }

  try {
    const sticker = await assignStickerToHousehold(params.stickerId, parsed.data.householdId);
    return NextResponse.json(sticker);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to assign sticker" },
      { status: 400 }
    );
  }
}
