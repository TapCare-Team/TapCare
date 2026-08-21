import { z } from "zod";
import { householdValidationMessages, validateHouseholdAddressLine1, validateOptionalAddressLine2, validateOptionalPostalCode, validateOptionalUnitNumber } from "@/modules/households/domain/household-input-validation";

const empty = (value: unknown) => typeof value === "string" && value.trim() === "" ? undefined : value;
const optional = z.preprocess(empty, z.string().trim().min(1).optional());
export const updateHouseholdSchema = z.object({ addressLine1: z.string().trim(), addressLine2: optional, unitNumber: z.preprocess(empty, z.string().trim().regex(/^#[A-Za-z0-9]{2,3}-[A-Za-z0-9]{2,5}$/, householdValidationMessages.unitInvalid).optional()), postalCode: z.preprocess(empty, z.string().trim().regex(/^\d{6}$/, householdValidationMessages.postalInvalid).optional()) }).superRefine((value, context) => {
  for (const [path, error] of [["addressLine1", validateHouseholdAddressLine1(value.addressLine1)], ["addressLine2", validateOptionalAddressLine2(value.addressLine2)], ["unitNumber", validateOptionalUnitNumber(value.unitNumber)], ["postalCode", validateOptionalPostalCode(value.postalCode)]] as const) if (error) context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: error });
});
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
