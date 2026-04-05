import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listHouseholdStickersForUser } from "@/modules/stickers/services/sticker-setup.service";

export async function GET(
  _request: Request,
  { params }: { params: { householdId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stickers = await listHouseholdStickersForUser(user, params.householdId);
    return NextResponse.json(stickers);
  } catch (error) {
    if (error instanceof Error && error.message === "Household not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list stickers" },
      { status: 400 }
    );
  }
}
