import { z } from "zod";

export const createTicketSchema = z.object({
  categoryId: z
    .number()
    .int()
    .positive("Category ID must be a positive number"),

  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject cannot exceed 200 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
});

export type CreateTicketInput = z.infer<
  typeof createTicketSchema
>;