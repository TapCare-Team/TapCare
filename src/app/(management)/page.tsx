import Link from "next/link";
import { HouseholdAccessRequestReviewPanel } from "@/components/admin/household-access-request-review-panel";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FollowUpReasonFilterBar } from "@/components/admin/follow-up-reason-filter";
import { HouseholdTriageList } from "@/components/admin/household-triage-list";
import { requireUserWithRole } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import type { Household } from "@/modules/households/domain/household";
import { getAdminHouseholds } from "@/modules/households/services/household-analytics.service";
import { listPendingHouseholdAccessRequestsForAdmin } from "@/modules/households/services/household-access-request.service";
import { normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";
import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";

export const dynamic = "force-dynamic";

async function AdminHouseholdDashboardPage({
  searchParams
}: {
  searchParams?: { reason?: string | string[] };
}) {
  const user = await requireUserWithRole(["ADMIN"]);
  const selectedReason = normalizeFollowUpReasonFilter(
    Array.isArray(searchParams?.reason) ? searchParams?.reason[0] : searchParams?.reason
  );
  const [households, pendingRequests] = await Promise.all([
    getAdminHouseholds(),
    isDatabaseConfigured() ? listPendingHouseholdAccessRequestsForAdmin(user) : Promise.resolve([])
  ]);
  const filteredHouseholds =
    selectedReason === "all"
      ? households
      : households.filter(
          (household: Household & { signal: FollowUpSignal | null }) =>
            household.signal?.signalType === selectedReason
        );

  return (
    <AppShell
      title="Households"
      subtitle="Prioritise households by follow-up reason, then open a household to review setup and activity."
      nav={[{ href: "/admin/analytics", label: "Analytics" }]}
    >
      <Panel title="Household requests" eyebrow={`${pendingRequests.length} pending`}>
        <HouseholdAccessRequestReviewPanel initialRequests={pendingRequests} />
      </Panel>

      <Panel
        eyebrow={`${filteredHouseholds.length} of ${households.length} households`}
        title="Manage households"
        action={
          <Link
            href="/households/new"
            className="rounded-full border border-accent/30 bg-accentSoft px-6 py-3 text-base font-semibold text-accent shadow-sm transition hover:bg-white"
          >
            Add household
          </Link>
        }
      >
        <div className="mb-5">
          <FollowUpReasonFilterBar basePath="/" selectedReason={selectedReason} />
        </div>
        <HouseholdTriageList households={filteredHouseholds} />
      </Panel>
    </AppShell>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(defaultRouteForUser(user));
  return <main className="min-h-screen bg-canvas text-ink"><header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"><p className="font-semibold uppercase tracking-[0.24em] text-accent">TapCare</p><div className="flex gap-3"><Link href="/login" className="rounded-full border border-black/10 px-4 py-2 text-sm">Log in</Link><Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">Sign up</Link></div></header><section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.3fr_0.7fr]"><div><p className="text-sm font-semibold text-accent">NFC support that stays human</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Practical support pages for older adults, with follow-up visibility for care teams.</h1><p className="mt-6 max-w-2xl text-lg text-muted">TapCare turns a simple NFC tap or QR scan into a clear contact action, checklist, help profile, or trusted resource page — without collecting message or call content.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-full bg-accent px-5 py-3 font-semibold text-white">Create caregiver account</Link><Link href="/login" className="rounded-full border border-black/10 bg-white px-5 py-3 font-semibold">Log in to TapCare</Link></div></div><aside className="rounded-3xl border border-black/5 bg-white p-6 shadow-panel"><p className="text-sm font-semibold text-accent">How it works</p><ol className="mt-4 space-y-4 text-sm text-muted"><li><strong className="text-ink">1. Set up a sticker.</strong><br />Care teams configure a private, household-specific action.</li><li><strong className="text-ink">2. Tap or scan.</strong><br />Older adults reach the right support page without an app.</li><li><strong className="text-ink">3. Follow up thoughtfully.</strong><br />Admins see explainable usage signals, not diagnoses.</li></ol></aside></section><section className="border-t border-black/5 bg-white"><div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3"><div><h2 className="font-semibold">For older adults</h2><p className="mt-2 text-sm text-muted">Simple, large-action pages for immediate support.</p></div><div><h2 className="font-semibold">For caregivers</h2><p className="mt-2 text-sm text-muted">Manage assigned household stickers and request access when needed.</p></div><div><h2 className="font-semibold">For administrators</h2><p className="mt-2 text-sm text-muted">Coordinate households and review privacy-conscious follow-up signals.</p></div></div></section></main>;
}
