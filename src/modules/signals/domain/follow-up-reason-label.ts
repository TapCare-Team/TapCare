import type { SignalType } from "@/modules/signals/domain/follow-up-signal";

const followUpReasonLabels: Record<SignalType, string> = {
  REPEATED_EMERGENCY_USAGE: "Frequent emergency contact use",
  REPEATED_HELP_PROFILE_USAGE: "Frequent help profile use",
  HIGH_CONTACT_USAGE: "Frequent contact support use",
  HIGH_REMINDER_USAGE: "Frequent reminder use",
  SUDDEN_INACTIVITY: "No recent sticker activity",
  NO_ACTIVE_CRITICAL_STICKER: "No active essential sticker",
  REPEATED_FAILED_INTERACTIONS: "Repeated failed sticker attempts"
};

export function labelForFollowUpReason(signalType: SignalType) {
  return followUpReasonLabels[signalType];
}
