import { notFound } from "next/navigation";
import { StickerSetupManager } from "@/components/setup/sticker-setup-manager";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function NewCaregiverStickerPage({
  params
}: {
  params: { householdId: string };
}) {
  const user = await requireUserWithRole(["CAREGIVER"]);
  const detail = await getHouseholdDetail(user, params.householdId, { preset: "all" });

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title="Add sticker"
      subtitle={`Create one new sticker setup for ${detail.household.displayAddress}.`}
      nav={[
        { href: `/caregiver/households/${detail.household.id}/stickers`, label: "Sticker setup", replace: true }
      ]}
      homeHref="/caregiver"
    >
      <Panel title="New sticker details" eyebrow="Sticker setup">
        <p className="text-sm text-muted">
          Choose the sticker purpose first. The required details will change based on what the sticker should do.
        </p>
      </Panel>

      <StickerSetupManager
        household={detail.household}
        initialStickers={[]}
        canPersist={isDatabaseConfigured()}
        mode="create"
        afterCreateHref={`/caregiver/households/${detail.household.id}/stickers`}
      />
    </AppShell>
  );
}
