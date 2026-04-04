export const signalTypes = [
  "REPEATED_EMERGENCY_USAGE",
  "REPEATED_HELP_PROFILE_USAGE",
  "HIGH_CONTACT_USAGE",
  "HIGH_REMINDER_USAGE",
  "SUDDEN_INACTIVITY",
  "NO_ACTIVE_CRITICAL_STICKER",
  "REPEATED_FAILED_INTERACTIONS"
] as const;

export type SignalType = (typeof signalTypes)[number];

export type FollowUpSignal = {
  id: string;
  householdId: string;
  siteId: string;
  signalType: SignalType;
  status: "ACTIVE" | "REVIEWED" | "DISMISSED" | "RESOLVED";
  explanation: string;
  firstObservedAt: string;
  lastObservedAt: string;
  evidence: Record<string, number | string>;
};
