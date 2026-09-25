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

export interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: number;
  student_id: number;
  assigned_to: number | null;
  pending_reason?: string | null;
  resolution_summary?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}