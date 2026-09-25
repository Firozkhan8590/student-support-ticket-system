import { Router } from "express";

import { authenticate, requireRole } from "../../middleware/auth.middleware";

import {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  updateTicketPriority,
  getStaffTicketById,
  resolveTicket,
  closeTicket,
  reopenTicket,
} from "../../controllers/ticket/ticket.controller";

import { escalateTicketController } from "../../controllers/ticket/escalation.controller";
import { processSLABreachesController } from "../../controllers/ticket/sla.controller";

const router = Router();

router.use(authenticate);

// ===============================
// Student
// ===============================

router.post(
  "/",
  requireRole("STUDENT"),
  createTicket
);

router.get(
  "/my",
  requireRole("STUDENT"),
  getMyTickets
);

// ===============================
// Staff / Manager
// ===============================

router.get(
  "/",
  requireRole("STAFF", "MANAGER"),
  getAllTickets
);

router.patch(
  "/:id/assign",
  requireRole("STAFF", "MANAGER"),
  assignTicket
);

router.patch(
  "/:id/status",
  requireRole("STAFF", "MANAGER"),
  updateTicketStatus
);

router.patch(
  "/:id/priority",
  requireRole("STAFF", "MANAGER"),
  updateTicketPriority
);

router.patch(
  "/:id/resolve",
  requireRole("STAFF", "MANAGER"),
  resolveTicket
);

router.patch(
  "/:id/close",
  requireRole("STAFF", "MANAGER"),
  closeTicket
);

router.patch(
  "/:id/reopen",
  requireRole("STAFF", "MANAGER"),
  reopenTicket
);

router.patch(
  "/:id/escalate",
  requireRole("STAFF", "MANAGER"),
  escalateTicketController
);

router.get(
  "/staff/:id",
  requireRole("STAFF", "MANAGER"),
  getStaffTicketById
);

router.post(
  "/sla/process",
  requireRole("MANAGER"),
  processSLABreachesController
);

// ===============================
// Comments
// ===============================

router.post(
  "/:id/comments",
  requireRole("STUDENT", "STAFF", "MANAGER"),
  addTicketComment
);

// ===============================
// Student Ticket Details
// ===============================

router.get(
  "/:id",
  requireRole("STUDENT"),
  getTicketById
);

export default router;