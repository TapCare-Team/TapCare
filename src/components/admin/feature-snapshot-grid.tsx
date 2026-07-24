import { labelForStickerType } from "@/modules/analytics/services/feature-analytics.service";
import type { FeatureSnapshot } from "@/modules/analytics/domain/analytics";

export function FeatureSnapshotGrid({ snapshots }: { snapshots: FeatureSnapshot[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {snapshots.map((snapshot) => (
        <div key={snapshot.stickerType} className="rounded-2xl border border-black/5 bg-white p-4">
          <p className="text-sm font-medium">{labelForStickerType(snapshot.stickerType)}</p>
          <p className="mt-3 text-2xl font-semibold">{snapshot.successfulEvents}</p>
          <p className="text-sm text-muted">{snapshot.uniqueHouseholds} households used this</p>
          <p className="mt-2 text-xs text-muted">
            Repeat households: {snapshot.repeatHouseholds} | Failed scans: {snapshot.failedEvents} (
            {Math.round(snapshot.failureRate * 100)}%)
          </p>
        </div>
      ))}
    </div>
  );
}
