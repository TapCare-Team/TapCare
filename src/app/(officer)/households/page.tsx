import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { SignalBadge } from "@/components/shared/signal-badge";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export default async function HouseholdsPage() {
  const households = await getOfficerHouseholds("site-sgo-bedok");

  return (
    <AppShell
      title="Seniors and Households"
      subtitle="Operational household list with activation state and follow-up context."
      nav={[
        { href: "/", label: "Dashboard" },
        { href: "/households", label: "Households" },
        { href: "/follow-up", label: "Follow-up queue" }
      ]}
    >
      <Panel title="Household list" eyebrow="Site scope">
        <div className="space-y-4">
          {households.map((household) => (
            <div key={household.id} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{household.displayLabel}</p>
                  <p className="text-sm text-muted">
                    {household.seniorAliases.join(", ")} | {household.siteName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {household.signal ? <SignalBadge signalType={household.signal.signalType} /> : null}
                  <Link href={`/households/${household.id}`} className="font-medium">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
