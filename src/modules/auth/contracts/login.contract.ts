import { z } from "zod";

export const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.")
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(32, "Reset link is invalid or expired."),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
