import type { SignalType } from "@/modules/signals/domain/follow-up-signal";

const colors: Record<SignalType, string> = {
  REPEATED_EMERGENCY_USAGE: "bg-orange-100 text-orange-700",
  REPEATED_HELP_PROFILE_USAGE: "bg-sky-100 text-sky-700",
  HIGH_CONTACT_DEPENDENCE: "bg-amber-100 text-amber-700",
  HIGH_REMINDER_DEPENDENCE: "bg-teal-100 text-teal-700",
  SUDDEN_INACTIVITY: "bg-rose-100 text-rose-700",
  NEVER_ACTIVATED_KEY_STICKER: "bg-stone-200 text-stone-700",
  STOPPED_USING_KEY_STICKER: "bg-purple-100 text-purple-700",
  REPEATED_FAILED_INTERACTIONS: "bg-red-100 text-red-700"
};

export function SignalBadge({ signalType }: { signalType: SignalType }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[signalType]}`}>
      {signalType.replaceAll("_", " ")}
    </span>
  );
}
