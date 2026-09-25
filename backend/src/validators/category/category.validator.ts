import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name is too long"),

  description: z
    .string()
    .max(500, "Description is too long")
    .optional(),

  defaultPriority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .default("MEDIUM"),

  slaHours: z
    .number()
    .int()
    .positive("SLA hours must be greater than 0"),
});

export const updateCategorySchema = createCategorySchema.partial();