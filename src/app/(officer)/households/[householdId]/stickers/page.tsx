import { notFound } from "next/navigation";
import { StickerSetupManager } from "@/components/setup/sticker-setup-manager";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function OfficerStickerSetupPage({
  params
}: {
  params: { householdId: string };
}) {
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const detail = await getHouseholdDetail(user, params.householdId, { preset: "all" });

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title="Sticker setup"
      subtitle={`Configure household-specific sticker routing for ${detail.household.displayAddress}.`}
      nav={[
        { href: `/households/${detail.household.id}`, label: "Back to household" },
        { href: "/households", label: "Households" }
      ]}
    >
      <Panel title="Setup surface" eyebrow="Officers and caregivers">
        <p className="text-sm text-muted">
          Keep setup minimal: choose the sticker type, its runtime mode, then add either one redirect destination or
          one page configuration.
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
