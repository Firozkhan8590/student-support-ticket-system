import { Response } from "express";
import * as ticketService from "../../modules/tickets/ticket.service";
import { createTicketSchema } from "../../validators/ticket.validator";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createCommentSchema } from "../../validators/comment.validator";
import { ticketQuerySchema } from "../../validators/ticket-query.validator";

export const createTicket = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        // Make sure user is logged in
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Only students can create tickets
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can create tickets",
            });
        }

        // Validate request body
        const validation =
            createTicketSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket data",
                errors: validation.error.flatten(),
            });
        }

        const result = await ticketService.createTicket(
            req.user.id,
            validation.data
        );

        return res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to create ticket",
        });
    }
};

export const getMyTickets = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access this endpoint",
            });
        }

        const tickets = await ticketService.getMyTickets(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: tickets,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch tickets",
        });
    }
};

export const getTicketById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access this endpoint",
            });
        }

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        const result = await ticketService.getTicketById(
            ticketId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Ticket not found",
        });
    }
};
export const getAllTickets = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (
            req.user.role !== "STAFF" &&
            req.user.role !== "MANAGER"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only staff and managers can access the ticket queue",
            });
        }

        const validation = ticketQuerySchema.safeParse(req.query);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket query parameters",
                errors: validation.error.flatten(),
            });
        }

        const tickets = await ticketService.getAllTickets(
            validation.data
        );

        return res.status(200).json({
            success: true,
            data: tickets,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch ticket queue",
        });
    }
};
export const assignTicket = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (
            req.user.role !== "STAFF" &&
            req.user.role !== "MANAGER"
        ) {
            return res.status(403).json({
                success: false,
                message: "Only staff and managers can assign tickets",
            });
        }

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        const { assignedTo } = req.body;

        if (
            !Number.isInteger(assignedTo) ||
            assignedTo <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "assignedTo must be a valid user ID",
            });
        }

        const ticket = await ticketService.assignTicket(
            ticketId,
            assignedTo,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Ticket assigned successfully",
            data: ticket,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to assign ticket",
        });
    }
};

export const updateTicketStatus = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (
            req.user.role !== "STAFF" &&
            req.user.role !== "MANAGER"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only staff and managers can update ticket status",
            });
        }

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        const { status, pendingReason } = req.body;

        const validStatuses = [
            "OPEN",
            "ASSIGNED",
            "IN_PROGRESS",
            "PENDING_STUDENT",
            "RESOLVED",
            "CLOSED",
            "REOPENED",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket status",
            });
        }

        const ticket =
            await ticketService.updateTicketStatus(
                ticketId,
                status,
                req.user.id,
                pendingReason
            );

        return res.status(200).json({
            success: true,
            message: "Ticket status updated successfully",
            data: ticket,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to update ticket status",
        });
    }
};

export const addTicketComment = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        // Validate request body
        const validation = createCommentSchema.safeParse(
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment data",
                errors: validation.error.flatten(),
            });
        }

        const { comment, isInternal } = validation.data;

        // Students can only create public comments
        if (req.user.role === "STUDENT" && isInternal) {
            return res.status(403).json({
                success: false,
                message: "Students cannot create internal notes",
            });
        }

        const newComment =
            await ticketService.addTicketComment(
                ticketId,
                req.user.id,
                req.user.role,
                comment,
                isInternal
            );

        return res.status(201).json({
            success: true,
            message: isInternal
                ? "Internal note added successfully"
                : "Comment added successfully",
            data: newComment,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Failed to add comment";

        if (message === "Ticket not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }

        if (
            message === "You do not have access to this ticket"
        ) {
            return res.status(403).json({
                success: false,
                message,
            });
        }

        return res.status(400).json({
            success: false,
            message,
        });
    }
};

export const updateTicketPriority = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "STAFF" &&
      req.user.role !== "MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only staff and managers can update ticket priority",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const { priority } = req.body;

    const validPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority. Use LOW, MEDIUM, HIGH or URGENT",
      });
    }

    const ticket =
      await ticketService.updateTicketPriority(
        ticketId,
        priority,
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update ticket priority",
    });
  }
};

export const getStaffTicketById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "STAFF" &&
      req.user.role !== "MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only staff and managers can access staff ticket details",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket =
      await ticketService.getStaffTicketById(ticketId);

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch ticket details";

    if (message === "Ticket not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const resolveTicket = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "STAFF" &&
      req.user.role !== "MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only staff and managers can resolve tickets",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const { resolutionSummary } = req.body;

    if (
    !resolutionSummary ||
    typeof resolutionSummary !== "string" ||
    resolutionSummary.trim().length === 0 ||
    resolutionSummary.length > 2000
) {
    return res.status(400).json({
        success: false,
        message:
            "Resolution summary is required and must be 1-2000 characters",
    });
}

    const ticket =
      await ticketService.resolveTicket(
        ticketId,
        req.user.id,
        resolutionSummary
      );

    return res.status(200).json({
      success: true,
      message: "Ticket resolved successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to resolve ticket",
    });
  }
};

export const closeTicket = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "STAFF" &&
      req.user.role !== "MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only staff and managers can close tickets",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await ticketService.closeTicket(
      ticketId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to close ticket",
    });
  }
};

export const reopenTicket = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "STAFF" &&
      req.user.role !== "MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only staff and managers can reopen tickets",
      });
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await ticketService.reopenTicket(
      ticketId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Ticket reopened successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reopen ticket",
    });
  }
};