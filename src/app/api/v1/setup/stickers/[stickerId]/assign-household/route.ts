import { NextResponse } from "next/server";
import { z } from "zod";

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

  return NextResponse.json({
    stickerId: params.stickerId,
    householdId: parsed.data.householdId,
    ok: true
  });
}
