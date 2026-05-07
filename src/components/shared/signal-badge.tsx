import type { SignalType } from "@/modules/signals/domain/follow-up-signal";
import { labelForFollowUpReason } from "@/modules/signals/domain/follow-up-reason-label";

const colors: Record<SignalType, string> = {
  REPEATED_EMERGENCY_USAGE: "bg-orange-100 text-orange-700",
  REPEATED_HELP_PROFILE_USAGE: "bg-sky-100 text-sky-700",
  HIGH_CONTACT_USAGE: "bg-amber-100 text-amber-700",
  HIGH_REMINDER_USAGE: "bg-teal-100 text-teal-700",
  SUDDEN_INACTIVITY: "bg-rose-100 text-rose-700",
  NO_ACTIVE_CRITICAL_STICKER: "bg-stone-200 text-stone-700",
  REPEATED_FAILED_INTERACTIONS: "bg-red-100 text-red-700"
};

export function SignalBadge({ signalType }: { signalType: SignalType }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[signalType]}`}>
      {labelForFollowUpReason(signalType)}
    </span>
  );
}
