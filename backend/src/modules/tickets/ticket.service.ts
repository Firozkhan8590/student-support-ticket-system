import db from "../../config/database";
import { calculateSLAStatus } from "../../utils/sla.util";
import { TicketQueryInput } from "../../validators/ticket-query.validator";
import { CreateTicketInput } from "../../validators/ticket.validator";

const generateTicketNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(100 + Math.random() * 900);

    return `TKT-${year}-${timestamp}-${random}`;
};

export const createTicket = async (
    studentId: number,
    data: CreateTicketInput
) => {
    return db.transaction(async (trx) => {
        // 1. Check student
        const student = await trx("users")
            .where({
                id: studentId,
                is_active: true,
            })
            .first();

        if (!student) {
            throw new Error("Student account not found");
        }

        // 2. Check category
        const category = await trx("ticket_categories")
            .where({
                id: data.categoryId,
                is_active: true,
            })
            .first();

        if (!category) {
            throw new Error(
                "Category not found or category is inactive"
            );
        }

        // 3. Generate ticket number
        const ticketNumber = generateTicketNumber();

        // 4. Create ticket
        const [ticket] = await trx("tickets")
            .insert({
                ticket_number: ticketNumber,
                student_id: studentId,
                category_id: data.categoryId,
                subject: data.subject,
                description: data.description,
                status: "OPEN",
                priority: category.default_priority,
                assigned_to: null,
                pending_reason: null,
                resolution_summary: null,
                resolved_at: null,
                closed_at: null,
            })
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        // 5. Calculate SLA
        const now = new Date();

        // First response target = 25% of resolution SLA
        const firstResponseHours =
            Number(category.sla_hours) / 4;

        const firstResponseDueAt = new Date(
            now.getTime() +
            firstResponseHours * 60 * 60 * 1000
        );

        const resolutionDueAt = new Date(
            now.getTime() +
            Number(category.sla_hours) * 60 * 60 * 1000
        );

        // 6. Create SLA record
        const [sla] = await trx("ticket_sla")
            .insert({
                ticket_id: ticket.id,
                first_response_due_at: firstResponseDueAt,
                first_responded_at: null,
                resolution_due_at: resolutionDueAt,
                resolved_at: null,
                first_response_breached: false,
                resolution_breached: false,
            })
            .returning([
                "id",
                "ticket_id",
                "first_response_due_at",
                "first_responded_at",
                "resolution_due_at",
                "resolved_at",
                "first_response_breached",
                "resolution_breached",
            ]);

        // 7. Create activity
        await trx("ticket_activities").insert({
            ticket_id: ticket.id,
            user_id: studentId,
            activity_type: "CREATED",
            description: "Ticket created by student",
            metadata: JSON.stringify({
                status: "OPEN",
                priority: category.default_priority,
                categoryId: data.categoryId,
            }),
        });

        // 8. Return complete result
        return {
            ticket,
            sla,
        };
    });
};

export const getMyTickets = async (studentId: number) => {
    const tickets = await db("tickets as t")
        .leftJoin(
            "ticket_categories as c",
            "t.category_id",
            "c.id"
        )
        .leftJoin(
            "users as u",
            "t.assigned_to",
            "u.id"
        )
        .where("t.student_id", studentId)
        .select(
            "t.id",
            "t.ticket_number",
            "t.subject",
            "t.description",
            "t.status",
            "t.priority",
            "t.assigned_to",
            "t.created_at",
            "t.updated_at",
            "c.name as category_name",
            "u.name as assigned_to_name"
        )
        .orderBy("t.created_at", "desc");

    return tickets;
};

export const getTicketById = async (
    ticketId: number,
    studentId: number
) => {
    const ticket = await db("tickets as t")
        .leftJoin(
            "ticket_categories as c",
            "t.category_id",
            "c.id"
        )
        .leftJoin(
            "users as student",
            "t.student_id",
            "student.id"
        )
        .leftJoin(
            "users as staff",
            "t.assigned_to",
            "staff.id"
        )
        .where("t.id", ticketId)
        .where("t.student_id", studentId)
        .select(
            "t.id",
            "t.ticket_number",
            "t.student_id",
            "student.name as student_name",
            "student.email as student_email",
            "t.category_id",
            "c.name as category_name",
            "t.subject",
            "t.description",
            "t.status",
            "t.priority",
            "t.assigned_to",
            "staff.name as assigned_to_name",
            "t.pending_reason",
            "t.resolution_summary",
            "t.resolved_at",
            "t.closed_at",
            "t.created_at",
            "t.updated_at"
        )
        .first();

    if (!ticket) {
        throw new Error("Ticket not found");
    }

    const sla = await db("ticket_sla")
        .where("ticket_id", ticketId)
        .first();

    const comments = await db("ticket_comments as tc")
        .join("users as u", "tc.user_id", "u.id")
        .where("tc.ticket_id", ticketId)
        .where("tc.is_internal", false)
        .select(
            "tc.id",
            "tc.comment",
            "tc.is_internal",
            "tc.created_at",
            "u.id as user_id",
            "u.name as user_name",
            "u.role as user_role"
        )
        .orderBy("tc.created_at", "asc");

    const activities = await db("ticket_activities as ta")
        .join("users as u", "ta.user_id", "u.id")
        .where("ta.ticket_id", ticketId)
        .select(
            "ta.id",
            "ta.activity_type",
            "ta.description",
            "ta.metadata",
            "ta.created_at",
            "u.name as user_name",
            "u.role as user_role"
        )
        .orderBy("ta.created_at", "asc");

    return {
        ticket,
        sla,
        comments,
        activities,
    };
};

export const getAllTickets = async (query: TicketQueryInput) => {
  const {
    search,
    status,
    priority,
    categoryId,
    assignedTo,
    slaStatus,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = query;

  const offset = (page - 1) * limit;

  const baseQuery = db("tickets as t")
    .leftJoin("ticket_categories as c", "t.category_id", "c.id")
    .leftJoin("users as student", "t.student_id", "student.id")
    .leftJoin("users as staff", "t.assigned_to", "staff.id")
    .leftJoin("ticket_sla as sla", "t.id", "sla.ticket_id");

  /* =========================
     SEARCH
  ========================= */

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike(
          "t.ticket_number",
          `%${search}%`
        )
        .orWhereILike(
          "t.subject",
          `%${search}%`
        )
        .orWhereILike(
          "student.name",
          `%${search}%`
        )
        .orWhereILike(
          "student.email",
          `%${search}%`
        );
    });
  }

  /* =========================
     NORMAL FILTERS
  ========================= */

  if (status) {
    baseQuery.where("t.status", status);
  }

  if (priority) {
    baseQuery.where("t.priority", priority);
  }

  if (categoryId) {
    baseQuery.where(
      "t.category_id",
      categoryId
    );
  }

  if (assignedTo) {
    baseQuery.where(
      "t.assigned_to",
      assignedTo
    );
  }

  /* =========================
     SORTING
  ========================= */

  const sortColumnMap: Record<string, string> = {
    created_at: "t.created_at",
    updated_at: "t.updated_at",
    priority: "t.priority",
    status: "t.status",
  };

  const sortColumn =
    sortColumnMap[sortBy] ||
    "t.created_at";

  /* =========================
     FETCH DATA
     
     IMPORTANT:
     Do NOT paginate here when
     SLA filtering is required.
  ========================= */

  const tickets = await baseQuery
    .select(
      "t.id",
      "t.ticket_number",
      "t.subject",
      "t.status",
      "t.priority",
      "t.created_at",
      "t.updated_at",

      "c.id as category_id",
      "c.name as category_name",

      "student.id as student_id",
      "student.name as student_name",
      "student.email as student_email",

      "staff.id as assigned_to",
      "staff.name as assigned_to_name",

      "sla.first_response_due_at",
      "sla.first_responded_at",
      "sla.resolution_due_at",
      "sla.resolved_at",
      "sla.first_response_breached",
      "sla.resolution_breached"
    )
    .orderBy(sortColumn, sortOrder);

  /* =========================
     CALCULATE SLA
  ========================= */

  const formattedTickets = tickets.map(
    (ticket) => {
      const calculatedSlaStatus =
        ticket.first_response_due_at ||
        ticket.resolution_due_at
          ? calculateSLAStatus({
              createdAt:
                ticket.created_at,

              firstResponseDueAt:
                ticket.first_response_due_at,

              firstRespondedAt:
                ticket.first_responded_at,

              resolutionDueAt:
                ticket.resolution_due_at,

              resolvedAt:
                ticket.resolved_at,

              firstResponseBreached:
                ticket.first_response_breached,

              resolutionBreached:
                ticket.resolution_breached,
            })
          : null;

      return {
        ...ticket,
        slaStatus: calculatedSlaStatus,
      };
    }
  );

  /* =========================
     SLA FILTER
  ========================= */

  const filteredTickets = slaStatus
    ? formattedTickets.filter(
        (ticket) =>
          ticket.slaStatus?.status ===
          slaStatus
      )
    : formattedTickets;

  /* =========================
     CORRECT TOTAL
  ========================= */

  const total =
    filteredTickets.length;

  /* =========================
     PAGINATION
  ========================= */

  const paginatedTickets =
    filteredTickets.slice(
      offset,
      offset + limit
    );

  /* =========================
     RESPONSE
  ========================= */

  return {
    tickets: paginatedTickets,

    pagination: {
      page,
      limit,
      total,
      totalPages:
        Math.ceil(total / limit),
    },
  };
};
export const assignTicket = async (
    ticketId: number,
    assignedTo: number,
    actorId: number
) => {
    return db.transaction(async (trx) => {
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        const staff = await trx("users")
            .where({
                id: assignedTo,
                is_active: true,
            })
            .whereIn("role", ["STAFF", "MANAGER"])
            .first();

        if (!staff) {
            throw new Error(
                "Assigned user must be an active staff member or manager"
            );
        }

        const [updatedTicket] = await trx("tickets")
            .where("id", ticketId)
            .update({
                assigned_to: assignedTo,
                status: "ASSIGNED",
            })
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: actorId,
            activity_type: "ASSIGNED",
            description: `Ticket assigned to ${staff.name}`,
            metadata: JSON.stringify({
                assignedTo,
                assignedToName: staff.name,
            }),
        });

        return updatedTicket;
    });
};


const allowedStatusTransitions: Record<string, string[]> = {
    OPEN: ["ASSIGNED"],
    ASSIGNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["PENDING_STUDENT", "RESOLVED"],
    PENDING_STUDENT: ["IN_PROGRESS"],
    RESOLVED: ["CLOSED"],
    CLOSED: ["REOPENED"],
    REOPENED: ["IN_PROGRESS"],
};

export const updateTicketStatus = async (
    ticketId: number,
    newStatus:
        | "OPEN"
        | "ASSIGNED"
        | "IN_PROGRESS"
        | "PENDING_STUDENT"
        | "RESOLVED"
        | "CLOSED"
        | "REOPENED",
    actorId: number,
    pendingReason?: string
) => {
    return db.transaction(async (trx) => {
        // 1. Find ticket
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        const currentStatus = ticket.status;

        // 2. Prevent same status
        if (currentStatus === newStatus) {
            throw new Error(
                `Ticket is already ${newStatus}`
            );
        }

        // 3. Validate transition
        const allowedTransitions =
            allowedStatusTransitions[currentStatus] || [];

        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(
                `Cannot change ticket status from ${currentStatus} to ${newStatus}`
            );
        }

        // 4. Ticket must be assigned before work starts
        if (
            newStatus === "IN_PROGRESS" &&
            !ticket.assigned_to
        ) {
            throw new Error(
                "Ticket must be assigned before moving to IN_PROGRESS"
            );
        }

        // 5. Pending reason is required
        if (newStatus === "PENDING_STUDENT") {
            if (
                !pendingReason ||
                pendingReason.trim().length === 0
            ) {
                throw new Error(
                    "Pending reason is required when status is PENDING_STUDENT"
                );
            }

            if (pendingReason.trim().length > 1000) {
                throw new Error(
                    "Pending reason cannot exceed 1000 characters"
                );
            }
        }

        const updateData: Record<string, unknown> = {
            status: newStatus,
        };

        // 6. Set pending reason
        if (newStatus === "PENDING_STUDENT") {
            updateData.pending_reason =
                pendingReason!.trim();
        }

        // 7. Clear pending reason when work resumes
        if (newStatus === "IN_PROGRESS") {
            updateData.pending_reason = null;
        }

        // 8. Resolution timestamp
        if (newStatus === "RESOLVED") {
            updateData.resolved_at = new Date();
        }

        // 9. Closing timestamp
        if (newStatus === "CLOSED") {
            updateData.closed_at = new Date();
        }

        // 10. Reopening clears resolution/closure timestamps
        if (newStatus === "REOPENED") {
            updateData.resolved_at = null;
            updateData.closed_at = null;
        }

        // 11. Update ticket
        const [updatedTicket] = await trx("tickets")
            .where("id", ticketId)
            .update(updateData)
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        // 12. First response timestamp
        if (newStatus === "IN_PROGRESS") {
            const sla = await trx("ticket_sla")
                .where("ticket_id", ticketId)
                .first();

            if (sla && !sla.first_responded_at) {
                await trx("ticket_sla")
                    .where("ticket_id", ticketId)
                    .update({
                        first_responded_at: new Date(),
                    });
            }
        }

        // 13. Activity history
        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: actorId,
            activity_type: "STATUS_CHANGED",
            description: `Ticket status changed from ${currentStatus} to ${newStatus}`,
            metadata: JSON.stringify({
                previousStatus: currentStatus,
                newStatus,
                pendingReason:
                    newStatus === "PENDING_STUDENT"
                        ? pendingReason!.trim()
                        : null,
            }),
        });

        return updatedTicket;
    });
};

export const addTicketComment = async (
    ticketId: number,
    userId: number,
    userRole: "STUDENT" | "STAFF" | "MANAGER",
    comment: string,
    isInternal: boolean
) => {
    return db.transaction(async (trx) => {
        // 1. Check ticket
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // 2. Students cannot create internal notes
        if (userRole === "STUDENT" && isInternal) {
            throw new Error(
                "Students cannot create internal notes"
            );
        }

        // 3. Students can only comment on their own tickets
        if (
            userRole === "STUDENT" &&
            Number(ticket.student_id) !== Number(userId)
        ) {
            throw new Error(
                "You do not have access to this ticket"
            );
        }

        // 4. Staff/Manager can add comments to tickets
        const [newComment] = await trx("ticket_comments")
            .insert({
                ticket_id: ticketId,
                user_id: userId,
                comment,
                is_internal: isInternal,
            })
            .returning([
                "id",
                "ticket_id",
                "user_id",
                "comment",
                "is_internal",
                "created_at",
            ]);

        // 5. Add activity
        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: userId,
            activity_type: "COMMENT_ADDED",
            description: isInternal
                ? "Internal note added"
                : "Comment added",
            metadata: JSON.stringify({
                commentId: newComment.id,
                isInternal,
            }),
        });

        return newComment;
    });
};

const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
] as const;

export const updateTicketPriority = async (
    ticketId: number,
    newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    actorId: number
) => {
    return db.transaction(async (trx) => {
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.priority === newPriority) {
            throw new Error(
                `Ticket priority is already ${newPriority}`
            );
        }

        const previousPriority = ticket.priority;

        const [updatedTicket] = await trx("tickets")
            .where("id", ticketId)
            .update({
                priority: newPriority,
            })
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: actorId,
            activity_type: "PRIORITY_CHANGED",
            description: `Ticket priority changed from ${previousPriority} to ${newPriority}`,
            metadata: JSON.stringify({
                previousPriority,
                newPriority,
            }),
        });

        return updatedTicket;
    });
};

export const getStaffTicketById = async (ticketId: number) => {
    const ticket = await db("tickets as t")
        .leftJoin("ticket_categories as c", "t.category_id", "c.id")
        .leftJoin("users as student", "t.student_id", "student.id")
        .leftJoin("users as staff", "t.assigned_to", "staff.id")
        .where("t.id", ticketId)
        .select(
            "t.id",
            "t.ticket_number",
            "t.student_id",
            "student.name as student_name",
            "student.email as student_email",
            "student.phone as student_phone",
            "c.id as category_id",
            "c.name as category_name",
            "t.subject",
            "t.description",
            "t.status",
            "t.priority",
            "t.assigned_to",
            "staff.name as assigned_to_name",
            "t.pending_reason",
            "t.resolution_summary",
            "t.resolved_at",
            "t.closed_at",
            "t.created_at",
            "t.updated_at"
        )
        .first();

    if (!ticket) {
        throw new Error("Ticket not found");
    }

    const sla = await db("ticket_sla")
        .where("ticket_id", ticketId)
        .first();

    const slaStatus = sla
    ? calculateSLAStatus({
        createdAt: ticket.created_at,
        firstResponseDueAt: sla.first_response_due_at,
        firstRespondedAt: sla.first_responded_at,
        resolutionDueAt: sla.resolution_due_at,
        resolvedAt: sla.resolved_at,
        firstResponseBreached: sla.first_response_breached,
        resolutionBreached: sla.resolution_breached,
    })
    : null;

    const comments = await db("ticket_comments as tc")
        .leftJoin("users as u", "tc.user_id", "u.id")
        .where("tc.ticket_id", ticketId)
        .select(
            "tc.id",
            "tc.ticket_id",
            "tc.user_id",
            "u.name as user_name",
            "u.role as user_role",
            "tc.comment",
            "tc.is_internal",
            "tc.created_at"
        )
        .orderBy("tc.created_at", "asc");

    const activities = await db("ticket_activities as ta")
        .leftJoin("users as u", "ta.user_id", "u.id")
        .where("ta.ticket_id", ticketId)
        .select(
            "ta.id",
            "ta.ticket_id",
            "ta.user_id",
            "u.name as user_name",
            "u.role as user_role",
            "ta.activity_type",
            "ta.description",
            "ta.metadata",
            "ta.created_at"
        )
        .orderBy("ta.created_at", "asc");

    return {
        ticket,
        sla,
        slaStatus,
        comments,
        activities,
    };
};

export const resolveTicket = async (
    ticketId: number,
    actorId: number,
    resolutionSummary: string
) => {
    return db.transaction(async (trx) => {
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.status !== "IN_PROGRESS") {
            throw new Error(
                `Only IN_PROGRESS tickets can be resolved. Current status: ${ticket.status}`
            );
        }

        if (
            !resolutionSummary ||
            resolutionSummary.trim().length === 0
        ) {
            throw new Error(
                "Resolution summary is required"
            );
        }

        if (resolutionSummary.trim().length > 5000) {
            throw new Error(
                "Resolution summary cannot exceed 5000 characters"
            );
        }

        const resolvedAt = new Date();

        const [updatedTicket] = await trx("tickets")
            .where("id", ticketId)
            .update({
                status: "RESOLVED",
                resolution_summary:
                    resolutionSummary.trim(),
                resolved_at: resolvedAt,
            })
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        // Update SLA resolution timestamp
        await trx("ticket_sla")
            .where("ticket_id", ticketId)
            .update({
                resolved_at: resolvedAt,
            });

        // Add activity
        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: actorId,
            activity_type: "RESOLVED",
            description: "Ticket resolved",
            metadata: JSON.stringify({
                resolutionSummary:
                    resolutionSummary.trim(),
                resolvedAt,
            }),
        });

        return updatedTicket;
    });
};

export const closeTicket = async (
    ticketId: number,
    actorId: number
) => {
    return db.transaction(async (trx) => {
        const ticket = await trx("tickets")
            .where("id", ticketId)
            .first();

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.status !== "RESOLVED") {
            throw new Error(
                `Only RESOLVED tickets can be closed. Current status: ${ticket.status}`
            );
        }

        const closedAt = new Date();

        const [updatedTicket] = await trx("tickets")
            .where("id", ticketId)
            .update({
                status: "CLOSED",
                closed_at: closedAt,
            })
            .returning([
                "id",
                "ticket_number",
                "student_id",
                "category_id",
                "subject",
                "description",
                "status",
                "priority",
                "assigned_to",
                "pending_reason",
                "resolution_summary",
                "resolved_at",
                "closed_at",
                "created_at",
                "updated_at",
            ]);

        await trx("ticket_activities").insert({
            ticket_id: ticketId,
            user_id: actorId,
            activity_type: "CLOSED",
            description: "Ticket closed",
            metadata: JSON.stringify({
                closedAt,
            }),
        });

        return updatedTicket;
    });
};

export const reopenTicket = async (
  ticketId: number,
  actorId: number
) => {
  return db.transaction(async (trx) => {
    const ticket = await trx("tickets")
      .where("id", ticketId)
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "CLOSED") {
      throw new Error(
        `Only CLOSED tickets can be reopened. Current status: ${ticket.status}`
      );
    }

    const [updatedTicket] = await trx("tickets")
      .where("id", ticketId)
      .update({
        status: "REOPENED",
        closed_at: null,
        resolved_at: null,
      })
      .returning([
        "id",
        "ticket_number",
        "student_id",
        "category_id",
        "subject",
        "description",
        "status",
        "priority",
        "assigned_to",
        "pending_reason",
        "resolution_summary",
        "resolved_at",
        "closed_at",
        "created_at",
        "updated_at",
      ]);

    await trx("ticket_sla")
        .where("ticket_id", ticketId)
        .update({
            resolved_at: null,
        });

    await trx("ticket_activities").insert({
      ticket_id: ticketId,
      user_id: actorId,
      activity_type: "REOPENED",
      description: "Ticket reopened",
      metadata: JSON.stringify({
        previousStatus: "CLOSED",
        newStatus: "REOPENED",
      }),
    });

    return updatedTicket;
  });
};