import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { RecentActivityFilter } from "@/components/shared/recent-activity-filter";
import {
  getStickerUseEvents,
  RecentStickerActivityList
} from "@/components/shared/recent-sticker-activity-list";
import { SignalBadge } from "@/components/shared/signal-badge";
import { requireUserWithRole } from "@/lib/auth";
import { getSearchParamValue, normalizeActivityPreset } from "@/modules/households/domain/activity-range";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function CaregiverHouseholdPage({
  params,
  searchParams
}: {
  params: { householdId: string };
  searchParams?: { preset?: string | string[]; from?: string | string[]; to?: string | string[] };
}) {
  const { householdId } = params;
  const user = await requireUserWithRole(["CAREGIVER", "ADMIN"]);
  const preset = normalizeActivityPreset(getSearchParamValue(searchParams?.preset));
  const detail = await getHouseholdDetail(user, householdId, {
    preset,
    from: getSearchParamValue(searchParams?.from),
    to: getSearchParamValue(searchParams?.to)
  });

  if (!detail) {
    notFound();
  }

  const stickerUseEvents = getStickerUseEvents(detail.recentEvents);

  return (
    <AppShell
      title={detail.household.displayAddress}
      subtitle="Household usage summary and sticker setup access for assigned caregivers."
      nav={[{ href: "/caregiver", label: "Household list", replace: true }]}
      homeHref="/caregiver"
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Follow-up signals" eyebrow="Read only">
          <div className="space-y-3">
            {detail.signals.length === 0 ? (
              <p className="text-sm text-muted">No active signals for this household.</p>
            ) : (
              detail.signals.map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-black/5 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <SignalBadge signalType={signal.signalType} />
                    <p className="font-medium">{signal.explanation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Sticker status"
          eyebrow="Current setup"
          action={
            <Link
              href={`/caregiver/households/${detail.household.id}/stickers`}
              className="rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm text-accent transition hover:bg-white"
            >
              Manage stickers
            </Link>
          }
        >
          <div className="space-y-3">
            {detail.household.stickers.length === 0 ? (
              <p className="text-sm text-muted">No stickers have been set up for this household yet.</p>
            ) : (
              detail.household.stickers.map((sticker) => (
                <div key={sticker.id} className="rounded-2xl border border-black/5 bg-white p-4">
                  <p className="font-medium">{sticker.name}</p>
                  <p className="text-sm text-muted">
                    {sticker.displayCode} | {sticker.status} | {sticker.runtimeMode} | {sticker.stickerType.replaceAll("_", " ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Sticker usage" eyebrow={`${stickerUseEvents.length} uses in selected range`}>
        <RecentActivityFilter
          basePath={`/caregiver/households/${detail.household.id}`}
          preset={detail.activityWindow.preset}
          from={detail.activityWindow.from}
          to={detail.activityWindow.to}
          minDate={detail.activityBounds.earliest}
          maxDate={detail.activityBounds.latest}
        />
        <RecentStickerActivityList
          events={detail.recentEvents}
          emptyMessage="No sticker use matched the selected date range."
        />
      </Panel>
    </AppShell>
  );
}
