import { z } from "zod";

export const ticketQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),

  status: z
    .enum([
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "PENDING_STUDENT",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),

  categoryId: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),

  assignedTo: z
    .coerce
    .number()
    .int()
    .positive()
    .optional(),

  slaStatus: z
    .enum(["ON_TRACK", "AT_RISK", "BREACHED", "COMPLETED"])
    .optional(),

  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "priority",
      "status",
    ])
    .default("created_at"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),

  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;