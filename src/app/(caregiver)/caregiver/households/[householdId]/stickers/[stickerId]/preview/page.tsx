import { notFound } from "next/navigation";
import { StickerPreview } from "@/components/setup/sticker-preview";
import { AppShell } from "@/components/shared/app-shell";
import { requireUserWithRole } from "@/lib/auth";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export default async function CaregiverStickerPreviewPage({ params }: { params: { householdId: string; stickerId: string } }) {
  const user = await requireUserWithRole(["CAREGIVER"]);
  const detail = await getHouseholdDetail(user, params.householdId, { preset: "all" });
  const sticker = detail?.household.stickers.find((item) => item.id === params.stickerId);
  if (!detail || !sticker) notFound();
  return <AppShell title="Sticker preview" subtitle="Preview only — no interaction analytics are recorded." nav={[{ href: `/caregiver/households/${params.householdId}/stickers`, label: "Sticker setup", replace: true }]} homeHref="/caregiver"><StickerPreview sticker={sticker} /></AppShell>;
}
