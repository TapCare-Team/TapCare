import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageHousehold } from "@/modules/auth/services/access-control.service";
import { PrismaHouseholdsRepository } from "@/modules/households/repositories/prisma-households.repository";
import { listHouseholdStickers } from "@/modules/stickers/services/sticker-setup.service";

const householdsRepository = new PrismaHouseholdsRepository();

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const household = await householdsRepository.getById(params.householdId);
    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }
    if (!canManageHousehold(user, household.id, household.siteId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stickers = await listHouseholdStickers(params.householdId);
    return NextResponse.json(stickers);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list stickers" },
      { status: 400 }
    );
  }
}
