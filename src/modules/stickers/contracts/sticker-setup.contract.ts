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

const stickerTypeSchema = z.enum([
  "EMERGENCY_CONTACT",
  "FREQUENT_CONTACT",
  "CHECKLIST_REMINDER",
  "HELP_PROFILE",
  "CURATED_RESOURCES"
]);

const runtimeModeSchema = z.enum(["DIRECT_REDIRECT", "RENDER_PAGE"]);
const stickerStatusSchema = z.enum(["ACTIVE", "DISABLED"]);

export const createStickerSchema = z.object({
  householdId: z.string().min(1),
  stickerType: stickerTypeSchema,
  runtimeMode: runtimeModeSchema,
  status: stickerStatusSchema.default("ACTIVE"),
  name: z.string().min(1),
  isCritical: z.boolean().default(false),
  destination: destinationConfigSchema.optional(),
  page: pageConfigSchema.optional()
});

export const updateStickerSchema = z.object({
  stickerType: stickerTypeSchema.optional(),
  runtimeMode: runtimeModeSchema.optional(),
  status: stickerStatusSchema.optional(),
  name: z.string().min(1).optional(),
  isCritical: z.boolean().optional(),
  destination: destinationConfigSchema.optional(),
  page: pageConfigSchema.optional()
});

export const assignStickerHouseholdSchema = z.object({
  householdId: z.string().min(1)
});
