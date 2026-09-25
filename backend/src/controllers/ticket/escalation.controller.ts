import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { escalateTicket } from "../../modules/tickets/escalation.service";
import { escalateTicketSchema } from "../../validators/escalation.validator";

export const escalateTicketController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const ticketId = Number(req.params.id);

    if (Number.isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const validation = escalateTicketSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const result = await escalateTicket(
      ticketId,
      req.user.id,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Ticket escalated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Escalate ticket error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to escalate ticket",
    });
  }
};