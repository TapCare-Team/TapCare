import Link from "next/link";
import { notFound } from "next/navigation";
import { StickerSetupManager } from "@/components/setup/sticker-setup-manager";
import { StickerPrivacyGuidance } from "@/components/setup/sticker-privacy-guidance";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";
import { buildPublicStickerUrl } from "@/modules/stickers/services/public-sticker-url.service";

export const dynamic = "force-dynamic";

export default async function AdminStickerSetupPage({
  params,
  searchParams
}: {
  params: { householdId: string };
  searchParams?: { setupSticker?: string };
}) {
  const user = await requireUserWithRole(["ADMIN"]);
  const detail = await getHouseholdDetail(user, params.householdId, { preset: "all" });

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title="Sticker setup"
      subtitle={`Configure household-specific sticker routing for ${detail.household.displayAddress}.`}
      nav={[{ href: `/households/${detail.household.id}`, label: "Household details", replace: true }]}
    >
      <Panel
        title="Existing stickers"
        eyebrow="Admin and caregivers"
        action={
          <Link
            href={`/households/${detail.household.id}/stickers/new`}
            className="rounded-full border border-accent/30 bg-accentSoft px-5 py-2.5 text-sm font-semibold text-accent shadow-sm transition hover:bg-white"
          >
            Add sticker
          </Link>
        }
      >
        <p className="text-sm text-muted">
          Edit or remove stickers that have already been created for this household.
        </p>
        <div className="mt-4">
          <StickerPrivacyGuidance includeOperations />
        </div>
      </Panel>

      <StickerSetupManager
        household={detail.household}
        initialStickers={detail.household.stickers}
        canPersist={isDatabaseConfigured()}
        mode="manage"
        physicalStickerUrls={Object.fromEntries(detail.household.stickers.map((sticker) => [sticker.id, buildPublicStickerUrl(sticker.publicCode)]))}
        previewBasePath={`/households/${detail.household.id}/stickers`}
        setupStickerId={searchParams?.setupSticker}
      />
    </AppShell>
  );
}
