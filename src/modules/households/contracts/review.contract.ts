import { z } from "zod";

export const followUpReviewRequestSchema = z
  .object({
    status: z.enum(["REVIEWED", "DISMISSED", "RESOLVED", "SNOOZED"]),
    note: z.string().max(500).optional(),
    snoozedUntil: z.string().datetime().optional()
  })
  .superRefine((value, context) => {
    if (value.status === "SNOOZED" && !value.snoozedUntil) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "snoozedUntil is required when status is SNOOZED",
        path: ["snoozedUntil"]
      });
    }
  });

export type FollowUpReviewRequest = z.infer<typeof followUpReviewRequestSchema>;
