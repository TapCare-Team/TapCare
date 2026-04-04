import { z } from "zod";

export const destinationConfigSchema = z.object({
  type: z.enum(["WHATSAPP", "PHONE", "EXTERNAL_URL"]),
  value: z.string().min(1),
  label: z.string().max(120).optional()
});

export const pageConfigSchema = z.object({
  pageType: z.enum(["CHECKLIST", "HELP_PROFILE", "RESOURCES"]),
  title: z.string().min(1),
  content: z.record(z.unknown())
});

export const createStickerSchema = z.object({
  householdId: z.string().min(1),
  publicCode: z.string().min(1),
  stickerType: z.enum([
    "EMERGENCY_CONTACT",
    "FREQUENT_CONTACT",
    "CHECKLIST_REMINDER",
    "HELP_PROFILE",
    "CURATED_RESOURCES"
  ]),
  runtimeMode: z.enum(["DIRECT_REDIRECT", "RENDER_PAGE"]),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
  name: z.string().min(1),
  isCritical: z.boolean().default(false),
  destination: destinationConfigSchema.optional(),
  page: pageConfigSchema.optional()
});

export const updateStickerSchema = createStickerSchema.partial();
