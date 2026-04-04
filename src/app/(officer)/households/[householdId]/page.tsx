import { notFound } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { SignalBadge } from "@/components/shared/signal-badge";
import { requireUserWithRole } from "@/lib/auth";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";
import { labelForStickerType } from "@/modules/analytics/services/feature-analytics.service";

export const dynamic = "force-dynamic";

export default async function HouseholdDetailPage({
  params
}: {
  params: { householdId: string };
}) {
  const { householdId } = params;
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const detail = await getHouseholdDetail(user, householdId);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title={detail.household.displayAddress}
      subtitle="Household activity, NFC asset status, and explainable outreach signals."
      nav={[
        { href: "/", label: "Dashboard" },
        { href: "/households", label: "Back to households" },
        { href: "/follow-up", label: "Follow-up queue" }
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Follow-up context" eyebrow="Signals">
          <div className="space-y-4">
            {detail.signals.length === 0 ? (
              <p className="text-sm text-muted">No active follow-up signals for this household.</p>
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

        <Panel title="Sticker status" eyebrow="Runtime">
          <div className="space-y-3">
            {detail.household.stickers.map((sticker) => (
              <div key={sticker.id} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="font-medium">{sticker.name}</p>
                <p className="text-sm text-muted">
                  {sticker.status} | {sticker.runtimeMode} | {sticker.stickerType.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Recent activity" eyebrow="Last 12 events">
        <div className="space-y-3">
          {detail.recentEvents.map((event) => (
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
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
