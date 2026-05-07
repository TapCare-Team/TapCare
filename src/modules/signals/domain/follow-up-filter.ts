import type { FollowUpSignal, SignalType } from "@/modules/signals/domain/follow-up-signal";
import { signalTypes } from "@/modules/signals/domain/follow-up-signal";

export type FollowUpReasonFilter = "all" | SignalType;

export function normalizeFollowUpReasonFilter(value?: string): FollowUpReasonFilter {
  if (!value || value === "all") {
    return "all";
  }

  if (signalTypes.includes(value as SignalType)) {
    return value as SignalType;
  }

  return "all";
}

export function filterSignalsByReason(signals: FollowUpSignal[], reason: FollowUpReasonFilter) {
  if (reason === "all") {
    return signals;
  }

  return signals.filter((signal) => signal.signalType === reason);
}
