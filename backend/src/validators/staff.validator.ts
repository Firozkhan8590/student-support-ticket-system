import { z } from "zod";

export const createStaffSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .max(150, "Email must not exceed 150 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),
});

export const updateStaffSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  email: z
    .string()
    .email()
    .max(150)
    .optional(),

  phone: z
    .string()
    .max(20)
    .optional(),
});

export const updateStaffStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type UpdateStaffStatusInput = z.infer<
  typeof updateStaffStatusSchema
>;