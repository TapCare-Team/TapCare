import { z } from "zod";

export const stickerTypeSchema = z.enum([
  "EMERGENCY_CONTACT",
  "FREQUENT_CONTACT",
  "CHECKLIST_REMINDER",
  "HELP_PROFILE",
  "CURATED_RESOURCES"
]);

export const runtimeModeSchema = z.enum(["DIRECT_REDIRECT", "RENDER_PAGE"]);

export const interactionEventSchema = z.object({
  eventId: z.string().min(1),
  occurredAt: z.string().datetime(),
  siteId: z.string().min(1),
  householdId: z.string().min(1).optional(),
  seniorProfileId: z.string().min(1).optional(),
  stickerId: z.string().min(1).optional(),
  publicCode: z.string().min(1).optional(),
  stickerType: stickerTypeSchema.optional(),
  runtimeMode: runtimeModeSchema.optional(),
  eventType: z.enum(["STICKER_OPENED", "REDIRECT_ISSUED", "PAGE_RENDERED", "PAGE_ACTION_CLICKED"]),
  outcome: z.enum(["SUCCESS", "FAILED"]),
  destinationType: z.enum(["WHATSAPP", "PHONE", "EXTERNAL_URL"]).optional(),
  failureReason: z
    .enum([
      "INVALID_CODE",
      "DISABLED_STICKER",
      "INVALID_DESTINATION",
      "MISSING_CONFIGURATION",
      "BROKEN_LINK",
      "UNKNOWN"
    ])
    .optional(),
  sessionTokenHash: z.string().min(1).optional(),
  metadata: z
    .object({
      actionKey: z.enum(["open_link", "call", "whatsapp"]).optional()
    })
    .optional()
});

export type InteractionEventInput = z.infer<typeof interactionEventSchema>;

export const publicActionEventSchema = z
  .object({
    publicCode: z.string().min(1),
    actionKey: z.enum(["open_link", "call", "whatsapp"])
  })
  .strict();

export type PublicActionEventInput = z.infer<typeof publicActionEventSchema>;
