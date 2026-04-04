import { z } from "zod";

export const followUpSignalDtoSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  siteId: z.string(),
  signalType: z.enum([
    "REPEATED_EMERGENCY_USAGE",
    "REPEATED_HELP_PROFILE_USAGE",
    "HIGH_CONTACT_USAGE",
    "HIGH_REMINDER_USAGE",
    "SUDDEN_INACTIVITY",
    "NO_ACTIVE_CRITICAL_STICKER",
    "REPEATED_FAILED_INTERACTIONS"
  ]),
  status: z.enum(["ACTIVE", "REVIEWED", "DISMISSED", "RESOLVED"]),
  explanation: z.string(),
  firstObservedAt: z.string().datetime(),
  lastObservedAt: z.string().datetime(),
  evidence: z.record(z.union([z.string(), z.number()]))
});

export type FollowUpSignalDto = z.infer<typeof followUpSignalDtoSchema>;
