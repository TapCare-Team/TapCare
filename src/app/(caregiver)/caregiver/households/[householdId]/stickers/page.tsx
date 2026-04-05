import { notFound } from "next/navigation";
import { StickerSetupManager } from "@/components/setup/sticker-setup-manager";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function CaregiverStickerSetupPage({
  params
}: {
  params: { householdId: string };
}) {
  const user = await requireUserWithRole(["CAREGIVER", "ADMIN"]);
  const detail = await getHouseholdDetail(user, params.householdId, { preset: "all" });

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title="Sticker setup"
      subtitle={`Configure household-specific sticker routing for ${detail.household.displayAddress}.`}
      nav={[
        { href: `/caregiver/households/${detail.household.id}`, label: "Back to household" },
        { href: "/caregiver", label: "Caregiver view" }
      ]}
      homeHref="/caregiver"
    >
      <Panel title="Setup surface" eyebrow="Assigned households only">
        <p className="text-sm text-muted">
          Caregivers can configure only the households they are assigned to. Contact-oriented stickers should stay as
          one-tap redirects.
        </p>
      </Panel>

      <StickerSetupManager
        household={detail.household}
        initialStickers={detail.household.stickers}
        canPersist={isDatabaseConfigured()}
      />
    </AppShell>
  );
}
