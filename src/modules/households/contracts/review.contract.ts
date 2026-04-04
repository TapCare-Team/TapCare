import { z } from "zod";

export const followUpReviewRequestSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED", "RESOLVED", "SNOOZED"]),
  note: z.string().max(500).optional(),
  snoozedUntil: z.string().datetime().optional()
});

export type FollowUpReviewRequest = z.infer<typeof followUpReviewRequestSchema>;
