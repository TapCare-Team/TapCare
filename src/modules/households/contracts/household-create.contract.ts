import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalTrimmedString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

export const createHouseholdSchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  addressLine1: z.string().trim().min(1, "Block and street address are required"),
  addressLine2: optionalTrimmedString,
  unitNumber: optionalTrimmedString,
  postalCode: z
    .preprocess(emptyToUndefined, z.string().trim().regex(/^\d{6}$/, "Postal code must be 6 digits").optional()),
  seniorDisplayName: optionalTrimmedString
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
