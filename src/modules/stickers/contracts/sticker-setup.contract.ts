import { z } from "zod";
import { findPageConfigPrivacyIssue } from "@/modules/privacy/sticker-content-policy";

export const destinationConfigSchema = z.object({
  type: z.enum(["WHATSAPP", "PHONE", "EXTERNAL_URL"]),
  value: z.string().min(1),
  label: z.string().min(1).max(120).optional()
});

function isValidContactDestination(destination: z.infer<typeof destinationConfigSchema>) {
  if (destination.type === "PHONE") {
    const match = destination.value.match(/^tel:\+?(\d{8,15})$/);
    return Boolean(match);
  }

  if (destination.type === "WHATSAPP") {
    const match = destination.value.match(/^https:\/\/wa\.me\/(\d{8,15})$/);
    return Boolean(match);
  }

  return true;
}

const checklistPageConfigSchema = z.object({
  pageType: z.literal("CHECKLIST"),
  title: z.string().min(1),
  content: z.object({
    checklistItems: z.array(z.string().min(1)).min(1)
  })
});

const helpProfilePageConfigSchema = z.object({
  pageType: z.literal("HELP_PROFILE"),
  title: z.string().min(1),
  content: z.object({
    helpFields: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.string().min(1)
        })
      )
      .min(1)
  })
});

const resourcesPageConfigSchema = z.object({
  pageType: z.literal("RESOURCES"),
  title: z.string().min(1),
  content: z.object({
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          href: z.string().url()
        })
      )
      .min(1)
  })
});

export const pageConfigSchema = z.discriminatedUnion("pageType", [
  checklistPageConfigSchema,
  helpProfilePageConfigSchema,
  resourcesPageConfigSchema
]);

const stickerTypeSchema = z.enum([
  "EMERGENCY_CONTACT",
  "FREQUENT_CONTACT",
  "CHECKLIST_REMINDER",
  "HELP_PROFILE",
  "CURATED_RESOURCES"
]);

const runtimeModeSchema = z.enum(["DIRECT_REDIRECT", "RENDER_PAGE"]);
const stickerStatusSchema = z.enum(["ACTIVE", "DISABLED"]);

const baseCreateStickerSchema = z.object({
  householdId: z.string().min(1),
  stickerType: stickerTypeSchema,
  runtimeMode: runtimeModeSchema,
  status: stickerStatusSchema.default("ACTIVE"),
  name: z.string().min(1),
  isCritical: z.boolean().default(false),
  destination: destinationConfigSchema.optional(),
  page: pageConfigSchema.optional()
});

const baseUpdateStickerSchema = z.object({
  stickerType: stickerTypeSchema.optional(),
  runtimeMode: runtimeModeSchema.optional(),
  status: stickerStatusSchema.optional(),
  name: z.string().min(1).optional(),
  isCritical: z.boolean().optional(),
  destination: destinationConfigSchema.optional(),
  page: pageConfigSchema.optional()
});

function validatePurposeConfig(
  value: {
    stickerType?: z.infer<typeof stickerTypeSchema>;
    runtimeMode?: z.infer<typeof runtimeModeSchema>;
    isCritical?: boolean;
    destination?: z.infer<typeof destinationConfigSchema>;
    page?: z.infer<typeof pageConfigSchema>;
  },
  context: z.RefinementCtx
) {
  if (value.page) {
    const privacyIssue = findPageConfigPrivacyIssue(value.page);

    if (privacyIssue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["page", "content"],
        message: privacyIssue
      });
    }
  }

  if (
    value.destination &&
    (value.destination.type === "PHONE" || value.destination.type === "WHATSAPP") &&
    !isValidContactDestination(value.destination)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination", "value"],
      message: "Contact number must contain 8 to 15 digits"
    });
  }

  if (value.stickerType === "EMERGENCY_CONTACT") {
    if (value.runtimeMode !== "DIRECT_REDIRECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runtimeMode"],
        message: "Emergency contact stickers must open a contact action immediately"
      });
    }

    if (!value.isCritical) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isCritical"],
        message: "Emergency contact stickers must be marked important"
      });
    }

    if (!value.destination || !["WHATSAPP", "PHONE"].includes(value.destination.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Emergency contact stickers require a WhatsApp or phone contact"
      });
    }
  }

  if (value.stickerType === "FREQUENT_CONTACT") {
    if (value.runtimeMode !== "DIRECT_REDIRECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runtimeMode"],
        message: "Frequent contact stickers must open a contact action immediately"
      });
    }

    if (!value.destination || !["WHATSAPP", "PHONE"].includes(value.destination.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Frequent contact stickers require a WhatsApp or phone contact"
      });
    }
  }

  if (value.stickerType === "CHECKLIST_REMINDER") {
    if (value.runtimeMode !== "RENDER_PAGE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runtimeMode"],
        message: "Checklist and reminder stickers must render a TapCare page"
      });
    }

    if (value.page?.pageType !== "CHECKLIST") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["page"],
        message: "Checklist and reminder stickers require checklist page content"
      });
    }
  }

  if (value.stickerType === "HELP_PROFILE") {
    if (value.runtimeMode !== "RENDER_PAGE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runtimeMode"],
        message: "Help profile stickers must render a TapCare page"
      });
    }

    if (value.page?.pageType !== "HELP_PROFILE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["page"],
        message: "Help profile stickers require help profile fields"
      });
    }
  }

  if (value.stickerType === "CURATED_RESOURCES") {
    if (value.runtimeMode !== "RENDER_PAGE") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["runtimeMode"],
        message: "Curated resource stickers must render a TapCare page"
      });
    }

    if (value.page?.pageType !== "RESOURCES") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["page"],
        message: "Curated resource stickers require resource links"
      });
    }
  }
}

export const createStickerSchema = baseCreateStickerSchema.superRefine(validatePurposeConfig);
export const updateStickerSchema = baseUpdateStickerSchema.superRefine(validatePurposeConfig);

export const assignStickerHouseholdSchema = z.object({
  householdId: z.string().min(1)
});
