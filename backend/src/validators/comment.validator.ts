import { z } from "zod";

export const createCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),

  isInternal: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<
  typeof createCommentSchema
>;