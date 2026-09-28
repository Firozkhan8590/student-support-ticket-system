import api from "@/lib/api";

/* =========================
   TYPES
========================= */

export type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_STUDENT"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type SLAStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED"
  | "COMPLETED";

export interface TicketSLAStatus {
  status: SLAStatus;
  remainingMinutes: number | null;
  overdueMinutes: number;
  ageing: {
    ageInMinutes: number;
    ageLabel: string;
  };
}

export interface TicketListItem {
  id: number;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;

  created_at: string;
  updated_at: string;

  category_id: number;
  category_name?: string | null;

  student_id: number;
  student_name?: string | null;
  student_email?: string | null;

  assigned_to?: number | null;
  assigned_to_name?: string | null;

  first_response_due_at?: string | null;
  first_responded_at?: string | null;

  resolution_due_at?: string | null;
  resolved_at?: string | null;

  first_response_breached?: boolean;
  resolution_breached?: boolean;

  slaStatus?: TicketSLAStatus | null;
}

export interface TicketPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetAllTicketsParams {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: number;
  assignedTo?: number;
  slaStatus?: string;

  sortBy?: "created_at" | "updated_at" | "priority" | "status";
  sortOrder?: "asc" | "desc";

  page?: number;
  limit?: number;
}

export interface GetAllTicketsResponse {
  tickets: TicketListItem[];
  pagination: TicketPagination;
}

/* =========================
   STAFF TICKET DETAILS
========================= */

export interface StaffTicketDetails {
  id: number;
  ticket_number: string;

  student_id: number;
  student_name?: string | null;
  student_email?: string | null;
  student_phone?: string | null;

  category_id: number;
  category_name?: string | null;

  subject: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;

  assigned_to?: number | null;
  assigned_to_name?: string | null;

  pending_reason?: string | null;
  resolution_summary?: string | null;

  resolved_at?: string | null;
  closed_at?: string | null;

  created_at: string;
  updated_at: string;
}

/* =========================
   SLA
========================= */

export interface TicketSLA {
  id?: number;

  first_response_due_at?: string | null;
  first_responded_at?: string | null;

  resolution_due_at?: string | null;
  resolved_at?: string | null;

  first_response_breached?: boolean;
  resolution_breached?: boolean;

  status?: string | null;
}

/* =========================
   COMMENT
========================= */

export interface TicketComment {
  id: number;
  ticket_id?: number;

  user_id: number;
  user_name?: string | null;
  user_role?: string | null;

  comment: string;
  is_internal?: boolean;

  created_at: string;
}

/* =========================
   ACTIVITY
========================= */

export interface TicketActivity {
  id: number;
  ticket_id?: number;

  user_id?: number | null;
  user_name?: string | null;
  user_role?: string | null;

  activity_type: string;
  description: string;

  metadata?: unknown;

  created_at: string;
}

/* =========================
   STAFF TICKET DETAILS RESPONSE
========================= */

export interface StaffTicketDetailsResponse {
  ticket: StaffTicketDetails;
  sla?: TicketSLA | null;
  slaStatus?: string | null;
  comments: TicketComment[];
  activities: TicketActivity[];
}

/* =========================
   GET ALL TICKETS
========================= */

export const getAllTickets = async (
  params: GetAllTicketsParams = {}
): Promise<GetAllTicketsResponse> => {
  const response = await api.get("/tickets", {
    params,
  });

  return response.data.data;
};

/* =========================
   GET STAFF / MANAGER
   TICKET DETAILS
========================= */

export const getStaffTicketById = async (
  ticketId: number
): Promise<StaffTicketDetailsResponse> => {
  const response = await api.get(`/tickets/staff/${ticketId}`);

  return response.data.data;
};

/* =========================
   ASSIGN TICKET
========================= */

export const assignTicket = async (
  ticketId: number,
  assignedTo: number
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/assign`,
    {
      assignedTo,
    }
  );

  return response.data.data;
};

/* =========================
   UPDATE STATUS
========================= */

export const updateTicketStatus = async (
  ticketId: number,
  status: TicketStatus,
  pendingReason?: string
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/status`,
    {
      status,
      ...(pendingReason
        ? {
            pendingReason,
          }
        : {}),
    }
  );

  return response.data.data;
};

/* =========================
   UPDATE PRIORITY
========================= */

export const updateTicketPriority = async (
  ticketId: number,
  priority: TicketPriority
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/priority`,
    {
      priority,
    }
  );

  return response.data.data;
};

/* =========================
   ADD COMMENT
========================= */

export const addTicketComment = async (
  ticketId: number,
  comment: string,
  isInternal: boolean = false
): Promise<TicketComment> => {
  const response = await api.post(
    `/tickets/${ticketId}/comments`,
    {
      comment,
      isInternal,
    }
  );

  return response.data.data;
};

/* =========================
   RESOLVE TICKET
========================= */

export const resolveTicket = async (
  ticketId: number,
  resolutionSummary: string
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/resolve`,
    {
      resolutionSummary,
    }
  );

  return response.data.data;
};

/* =========================
   CLOSE TICKET
========================= */

export const closeTicket = async (
  ticketId: number
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/close`
  );

  return response.data.data;
};

/* =========================
   REOPEN TICKET
========================= */

export const reopenTicket = async (
  ticketId: number
): Promise<StaffTicketDetails> => {
  const response = await api.patch(
    `/tickets/${ticketId}/reopen`
  );

  return response.data.data;
};