import Link from "next/link";
import { notFound } from "next/navigation";
import { CaregiverAssignmentPanel } from "@/components/households/caregiver-assignment-panel";
import { DeleteHouseholdButton } from "@/components/households/delete-household-button";
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

export default async function HouseholdDetailPage({
  params,
  searchParams
}: {
  params: { householdId: string };
  searchParams?: { preset?: string | string[]; from?: string | string[]; to?: string | string[] };
}) {
  const { householdId } = params;
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
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
      subtitle="Review household activity, sticker status, and reasons this household may need follow-up."
      nav={[{ href: "/", label: "Household list", replace: true }]}
    >
      {user.role === "ADMIN" ? (
        <Panel title="Household actions" eyebrow="Admin">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm text-muted">
              Archive this household when it should no longer appear in active officer workflows. Existing stickers will
              be disabled, while historical interaction events remain available for analytics.
            </p>
            <DeleteHouseholdButton
              householdId={detail.household.id}
              householdLabel={detail.household.displayAddress}
            />
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Why this household may need follow-up" eyebrow="Follow-up">
          <div className="space-y-4">
            {detail.signals.length === 0 ? (
              <p className="text-sm text-muted">There are no active follow-up reasons for this household.</p>
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
              href={`/households/${detail.household.id}/stickers`}
              className="rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm text-accent transition hover:bg-white"
            >
              Manage stickers
            </Link>
          }
        >
          <div className="space-y-3">
            {detail.household.stickers.map((sticker) => (
              <div key={sticker.id} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="font-medium">{sticker.name}</p>
                <p className="text-sm text-muted">
                  {sticker.displayCode} | {sticker.status} | {sticker.runtimeMode} | {sticker.stickerType.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Caregiver access" eyebrow="Assignments">
        <CaregiverAssignmentPanel
          householdId={detail.household.id}
          assignments={detail.household.caregiverAssignments}
        />
      </Panel>

      <Panel title="Sticker usage" eyebrow={`${stickerUseEvents.length} uses in selected range`}>
        <RecentActivityFilter
          basePath={`/households/${detail.household.id}`}
          preset={detail.activityWindow.preset}
          from={detail.activityWindow.from}
          to={detail.activityWindow.to}
          minDate={detail.activityBounds.earliest}
          maxDate={detail.activityBounds.latest}
        />
        <RecentStickerActivityList
          events={detail.recentEvents}
          emptyMessage="No sticker use was recorded in the selected date range."
        />
      </Panel>
    </AppShell>
  );
}
