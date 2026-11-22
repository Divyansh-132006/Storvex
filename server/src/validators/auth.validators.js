import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .transform((email) => email.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .transform((email) => email.toLower()),
    password: z.string().min(1, "Password is required").max(72),
  })
  .strict();

export const googleSchema = z
  .object({
    idToken: z.string().trim().min(1, "Google ID token is required"),
  })
  .strict();
