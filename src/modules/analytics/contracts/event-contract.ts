import { z } from "zod";

export const templateKeySchema = z.enum([
  "emergency_contact",
  "frequent_contacts",
  "reminder_checklist",
  "resource_links",
  "help_profile"
]);

export const interactionEventSchema = z.object({
  eventId: z.string().min(1),
  occurredAt: z.string().datetime(),
  siteId: z.string().min(1),
  householdId: z.string().min(1).optional(),
  seniorProfileId: z.string().min(1).optional(),
  artifactId: z.string().min(1).optional(),
  templateKey: templateKeySchema,
  interactionType: z.enum(["tap", "qr_scan", "page_view", "action_click"]),
  routeType: templateKeySchema,
  outcome: z.enum(["success", "failed", "abandoned"]),
  failureReason: z
    .enum([
      "invalid_code",
      "expired_route",
      "permission_denied",
      "broken_link",
      "network_error",
      "unknown"
    ])
    .optional(),
  sessionTokenHash: z.string().min(1).optional(),
  metadata: z
    .object({
      actionKey: z.enum(["call", "whatsapp", "open_link", "check_item"]).optional(),
      checklistItemCount: z.number().int().nonnegative().optional()
    })
    .optional()
});

export type InteractionEventInput = z.infer<typeof interactionEventSchema>;
