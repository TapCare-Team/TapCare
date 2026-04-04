import { notFound } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { RecentActivityFilter } from "@/components/shared/recent-activity-filter";
import { SignalBadge } from "@/components/shared/signal-badge";
import { requireUserWithRole } from "@/lib/auth";
import { labelForStickerType } from "@/modules/analytics/services/feature-analytics.service";
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

  return (
    <AppShell
      title={detail.household.displayAddress}
      subtitle="Read-only household usage summary for assigned caregivers."
      nav={[{ href: "/caregiver", label: "Back to caregiver view" }]}
      homeHref="/caregiver"
    >
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

      <Panel title="Recent activity" eyebrow={`${detail.recentEvents.length} events in selected range`}>
        <RecentActivityFilter
          basePath={`/caregiver/households/${detail.household.id}`}
          preset={detail.activityWindow.preset}
          from={detail.activityWindow.from}
          to={detail.activityWindow.to}
          minDate={detail.activityBounds.earliest}
          maxDate={detail.activityBounds.latest}
        />
        <div className="space-y-3">
          {detail.recentEvents.length === 0 ? (
            <p className="text-sm text-muted">No activity matched the selected date range.</p>
          ) : (
            detail.recentEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {event.stickerType ? labelForStickerType(event.stickerType) : "Unknown sticker"}
                  </p>
                  <p className="text-sm text-muted">{new Date(event.occurredAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-muted">
                  {event.eventType} | {event.outcome}
                  {event.failureReason ? ` | ${event.failureReason}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
