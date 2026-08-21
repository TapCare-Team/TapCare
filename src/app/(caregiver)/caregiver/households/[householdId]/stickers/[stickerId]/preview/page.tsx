import { notFound } from "next/navigation";
import { StickerPreview } from "@/components/setup/sticker-preview";
import { AppShell } from "@/components/shared/app-shell";
import { requireUser } from "@/lib/auth";
import { getStickerForPreviewForUser } from "@/modules/stickers/services/sticker-setup.service";

export default async function CaregiverStickerPreviewPage({ params }: { params: { householdId: string; stickerId: string } }) {
  const user = await requireUser();
  const sticker = await getStickerForPreviewForUser(user, params.householdId, params.stickerId).catch(() => null);
  if (!sticker) notFound();
  return <AppShell title="Sticker preview" subtitle="Preview only — no interaction analytics are recorded." nav={[{ href: `/caregiver/households/${params.householdId}/stickers`, label: "Sticker setup", replace: true }]} homeHref="/caregiver"><StickerPreview sticker={sticker} /></AppShell>;
}
