import { z } from "zod";

const password = z.string().min(12).max(128)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(254),
  password,
  confirmPassword: z.string(),
}).refine((data) => data.name || data.fullName, {
  path: ["name"], message: "Full name is required",
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match",
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const firstField = Object.keys(fieldErrors)[0];
    const firstMessage = firstField ? fieldErrors[firstField]?.[0] : "Invalid request";
    return res.status(400).json({
      success: false,
      message: firstMessage || "Invalid request",
      errors: fieldErrors,
    });
  }
  req.body = result.data;
  next();
};
