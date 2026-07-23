import { z } from "zod";

export const assignCaregiverSchema = z.object({
  email: z.string().trim().email("Enter a valid caregiver email address").toLowerCase()
});

export type AssignCaregiverInput = z.infer<typeof assignCaregiverSchema>;
