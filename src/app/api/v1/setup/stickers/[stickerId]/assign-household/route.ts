import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canManageHousehold } from "@/modules/auth/services/access-control.service";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { assignStickerToHousehold } from "@/modules/stickers/services/sticker-setup.service";

const schema = z.object({ householdId: z.string().min(1) });
const householdsRepository = new PrismaHouseholdsRepository();

export async function POST(
  request: Request,
  { params }: { params: { stickerId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid assign payload" }, { status: 400 });
  }

  try {
    const household = await householdsRepository.getById(parsed.data.householdId);
    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }
    if (!canManageHousehold(user, household.id, household.siteId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sticker = await assignStickerToHousehold(params.stickerId, parsed.data.householdId);
    return NextResponse.json(sticker);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to assign sticker" },
      { status: 400 }
    );
  }
}
