import { z } from "zod";
import {
  householdValidationMessages,
  validateHouseholdAddressLine1,
  validateOptionalAddressLine2,
  validateOptionalPostalCode,
  validateOptionalUnitNumber
} from "@/modules/households/domain/household-input-validation";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalTrimmedString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

const optionalUnitNumber = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^#[A-Za-z0-9]{2,3}-[A-Za-z0-9]{2,5}$/, householdValidationMessages.unitInvalid)
    .optional()
);

export const createHouseholdSchema = z
  .object({
    siteId: z.string().trim().min(1, "Site is required"),
    addressLine1: z.string().trim(),
    addressLine2: optionalTrimmedString,
    unitNumber: optionalUnitNumber,
    postalCode: z.preprocess(
      emptyToUndefined,
      z.string().trim().regex(/^\d{6}$/, householdValidationMessages.postalInvalid).optional()
    ),
    seniorDisplayName: optionalTrimmedString
  })
  .superRefine((payload, context) => {
    const addressLine1Error = validateHouseholdAddressLine1(payload.addressLine1);
    const addressLine2Error = validateOptionalAddressLine2(payload.addressLine2);
    const unitError = validateOptionalUnitNumber(payload.unitNumber);
    const postalError = validateOptionalPostalCode(payload.postalCode);

    if (addressLine1Error) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: addressLine1Error, path: ["addressLine1"] });
    }

    if (addressLine2Error) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: addressLine2Error, path: ["addressLine2"] });
    }

    if (unitError) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: unitError, path: ["unitNumber"] });
    }

    if (postalError) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: postalError, path: ["postalCode"] });
    }
  });

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
