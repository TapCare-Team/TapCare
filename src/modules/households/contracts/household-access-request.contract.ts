import { z } from "zod";
import { createHouseholdSchema } from "@/modules/households/contracts/household-create.contract";

export const requestHouseholdAccessSchema = z.intersection(
  createHouseholdSchema,
  z.object({
    requesterNote: z
      .string()
      .trim()
      .max(300, "Keep the note under 300 characters.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
  })
);

export type RequestHouseholdAccessInput = z.infer<typeof requestHouseholdAccessSchema>;
