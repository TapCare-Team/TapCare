import { notFound } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { SignalBadge } from "@/components/shared/signal-badge";
import { getCurrentUser } from "@/lib/auth";
import { getHouseholdDetail } from "@/modules/households/services/household-analytics.service";

export default async function CaregiverHouseholdPage({
  params
}: {
  params: { householdId: string };
}) {
  const { householdId } = params;
  const user = await getCurrentUser("caregiver");
  const detail = await getHouseholdDetail(user, householdId);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      title={detail.household.displayLabel}
      subtitle="Read-only household usage summary for assigned caregivers."
      nav={[
        { href: "/caregiver", label: "Back to caregiver view" },
        { href: "/", label: "Officer dashboard" }
      ]}
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
    </AppShell>
  );
}
