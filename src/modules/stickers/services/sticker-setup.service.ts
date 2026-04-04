import { mockHouseholds } from "@/lib/mock-data";
import type { Sticker } from "@/modules/households/domain/household";

type CreateStickerInput = Omit<Sticker, "id"> & { householdId: string };

export async function listHouseholdStickers(householdId: string) {
  return mockHouseholds.find((household) => household.id === householdId)?.stickers ?? [];
}

export async function createSticker(input: CreateStickerInput) {
  return {
    ...input,
    id: `sticker-${input.publicCode.toLowerCase()}`
  };
}

export async function updateSticker(stickerId: string, patch: Partial<Sticker>) {
  return { stickerId, ...patch };
}
