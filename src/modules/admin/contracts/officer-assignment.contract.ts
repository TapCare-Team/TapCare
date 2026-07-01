import { z } from "zod";

export const assignOfficerSchema = z.object({
  email: z.string().trim().email("Enter a valid staff email address.").toLowerCase(),
  siteId: z.string().trim().min(1, "Choose a satellite office for this officer.")
});

export type AssignOfficerInput = z.infer<typeof assignOfficerSchema>;
