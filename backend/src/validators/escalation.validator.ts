import { z } from "zod";

export const escalateTicketSchema = z.object({
  escalatedTo: z.number().int().positive(),
  reason: z.string().min(1).max(1000),
  notes: z.string().max(5000).optional(),
});

export type EscalateTicketInput = z.infer<
  typeof escalateTicketSchema
>;