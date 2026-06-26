import Link from "next/link";
import type { FollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";
import { labelForFollowUpReason } from "@/modules/signals/domain/follow-up-reason-label";
import { signalTypes } from "@/modules/signals/domain/follow-up-signal";

export function FollowUpReasonFilterBar({
  basePath,
  selectedReason
}: {
  basePath: string;
  selectedReason: FollowUpReasonFilter;
}) {
  const filters = [
    { value: "all", label: "All" },
    ...signalTypes.map((signalType) => ({
      value: signalType,
      label: labelForFollowUpReason(signalType)
    }))
  ] as const;

  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => {
        const isActive = selectedReason === filter.value;

        return (
          <Link
            key={filter.value}
            href={filter.value === "all" ? basePath : `${basePath}?reason=${filter.value}`}
            className={`rounded-full px-4 py-2 text-sm transition ${
              isActive
                ? "border border-accent/20 bg-accentSoft text-accent"
                : "border border-black/10 text-muted hover:bg-panel"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
