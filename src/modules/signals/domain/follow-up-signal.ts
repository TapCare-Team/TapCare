export const signalTypes = [
  "REPEATED_EMERGENCY_USAGE",
  "REPEATED_HELP_PROFILE_USAGE",
  "HIGH_CONTACT_DEPENDENCE",
  "HIGH_REMINDER_DEPENDENCE",
  "SUDDEN_INACTIVITY",
  "NEVER_ACTIVATED_KEY_STICKER",
  "STOPPED_USING_KEY_STICKER",
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
