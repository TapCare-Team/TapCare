import Link from "next/link";
import { SignalBadge } from "@/components/shared/signal-badge";
import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";

export function FollowUpList({ signals }: { signals: FollowUpSignal[] }) {
  if (signals.length === 0) {
    return <p className="text-sm text-muted">No households matched the selected follow-up reason.</p>;
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div key={signal.id} className="rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SignalBadge signalType={signal.signalType} />
              <p className="font-medium">{signal.explanation}</p>
            </div>
            <Link href={`/households/${signal.householdId}`} className="text-sm font-medium">
              Open household
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            Last activity seen{" "}
            {new Date(signal.lastObservedAt).toLocaleString([], {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
