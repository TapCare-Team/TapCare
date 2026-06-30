import type { InteractionEvent } from "@/modules/analytics/domain/analytics";
import { labelForStickerType } from "@/modules/analytics/services/feature-analytics.service";

function failureReasonLabel(reason?: InteractionEvent["failureReason"]) {
  if (!reason) {
    return "";
  }

  const labels: Record<NonNullable<InteractionEvent["failureReason"]>, string> = {
    BROKEN_LINK: "The link could not be opened.",
    DISABLED_STICKER: "The sticker is disabled.",
    INVALID_CODE: "The sticker code was not recognized.",
    INVALID_DESTINATION: "The contact or link setup is invalid.",
    MISSING_CONFIGURATION: "The sticker setup is incomplete.",
    UNKNOWN: "The sticker could not be opened."
  };

  return labels[reason];
}

export function getStickerUseEvents(events: InteractionEvent[]) {
  return events.filter((event) => event.eventType === "STICKER_OPENED");
}

export function RecentStickerActivityList({
  events,
  emptyMessage
}: {
  events: InteractionEvent[];
  emptyMessage: string;
}) {
  const stickerUses = getStickerUseEvents(events);

  if (stickerUses.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {stickerUses.map((event) => {
        const usedSuccessfully = event.outcome === "SUCCESS";
        const failureLabel = failureReasonLabel(event.failureReason);

        return (
          <div key={event.id} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {event.stickerType ? labelForStickerType(event.stickerType) : "Unknown sticker"}
                </p>
                <p className={usedSuccessfully ? "mt-1 text-sm text-success" : "mt-1 text-sm text-red-700"}>
                  {usedSuccessfully ? "Sticker used successfully" : "Sticker use failed"}
                </p>
                {failureLabel ? <p className="mt-1 text-sm text-muted">{failureLabel}</p> : null}
              </div>
              <p className="text-sm text-muted">{new Date(event.occurredAt).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
