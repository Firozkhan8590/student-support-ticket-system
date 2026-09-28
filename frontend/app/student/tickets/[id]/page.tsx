"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Paperclip,
  Send,
  Ticket as TicketIcon,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_STUDENT"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketDetails {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: number;
  category_name?: string;
  student_id: number;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  pending_reason?: string | null;
  resolution_summary?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  sla?: {
    first_response_due_at?: string | null;
    first_responded_at?: string | null;
    resolution_due_at?: string | null;
    resolved_at?: string | null;
    first_response_breached?: boolean;
    resolution_breached?: boolean;
    status?: string;
  };
  comments?: CommentItem[];
  activities?: ActivityItem[];
  attachments?: AttachmentItem[];
}

interface CommentItem {
  id: number;
  user_id: number;
  user_name?: string;
  comment: string;
  is_internal?: boolean;
  created_at: string;
}

interface ActivityItem {
  id: number;
  user_id?: number;
  user_name?: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface AttachmentItem {
  id: number;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_path?: string;
  created_at: string;
}

export default function TicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.id as string;

  const { user, loading: authLoading, logout } = useAuth();

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "STUDENT") {
      if (user.role === "STAFF") {
        router.push("/staff/dashboard");
      } else {
        router.push("/manager/dashboard");
      }
      return;
    }

    if (ticketId) {
      fetchTicket();
    }
  }, [user, authLoading, ticketId, router]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(`/tickets/${ticketId}`);

      const data = response.data.data;

      if (!data?.ticket) {
        throw new Error("Invalid ticket response");
      }

      setTicket({
        ...data.ticket,
        sla: data.sla || null,
        comments: data.comments || [],
        activities: data.activities || [],
        attachments: data.attachments || [],
      });
    } catch (error: any) {
      console.error("Failed to load ticket:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to load this ticket."
      );
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    const trimmedComment = comment.trim();

    if (!trimmedComment) return;

    try {
      setSendingComment(true);

      await api.post(`/tickets/${ticketId}/comments`, {
        comment: trimmedComment,
      });

      setComment("");

      await fetchTicket();
    } catch (error: any) {
      console.error("Failed to add comment:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to add comment."
      );
    } finally {
      setSendingComment(false);
    }
  };

  const formatStatus = (status?: string | null) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status?: TicketStatus | null) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "ASSIGNED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "PENDING_STUDENT":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "RESOLVED":
      return "bg-green-50 text-green-700 border-green-200";

    case "CLOSED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "REOPENED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-50 border-red-200";

      case "HIGH":
        return "text-orange-600 bg-orange-50 border-orange-200";

      case "MEDIUM":
        return "text-amber-600 bg-amber-50 border-amber-200";

      case "LOW":
        return "text-slate-500 bg-slate-50 border-slate-200";

      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading ticket...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Unable to load ticket
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {errorMessage || "Ticket not found."}
          </p>

          <button
            onClick={() => router.push("/student/tickets")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  const slaStatus =
    ticket.sla?.status ||
    (ticket.sla?.resolution_breached ? "BREACHED" : "ON_TRACK");

  return (
    <div className="min-h-screen bg-slate-50">

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>

          <span className="font-semibold text-slate-900">
            Student Support
          </span>
        </div>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {mobileMenu ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-20 border-b bg-white p-4 shadow-lg lg:hidden">
          <nav className="space-y-1">
            <button
              onClick={() => router.push("/student/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => router.push("/student/tickets")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <TicketIcon className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() => router.push("/student/tickets/create")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-5 w-5" />
              Create Ticket
            </button>

            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Student Support
              </p>

              <p className="text-xs text-slate-400">
                College Helpdesk
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <button
              onClick={() => router.push("/student/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => router.push("/student/tickets")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <TicketIcon className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() => router.push("/student/tickets/create")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-5 w-5" />
              Create Ticket
            </button>
          </nav>

          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "Student"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.studentId || "Student"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-5 sm:p-8">

            {/* BACK */}
            <button
              onClick={() => router.push("/student/tickets")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Tickets
            </button>

            {/* HEADER */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {ticket.ticket_number}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        ticket.status
                      )}`}
                    >
                      {formatStatus(ticket.status)}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {ticket.subject}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Created on {formatDateTime(ticket.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                  <TicketIcon className="h-5 w-5 text-blue-600" />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Ticket ID
                    </p>

                    <p className="text-sm font-bold text-slate-800">
                      #{ticket.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="mt-5 grid gap-5 lg:grid-cols-3">

              {/* TICKET INFO */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Ticket Information
                    </h2>

                    <p className="text-xs text-slate-400">
                      Request details
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Category
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {ticket.category_name || `Category #${ticket.category_id}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Priority
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityStyle(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Assigned To
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-400" />

                      <p className="text-sm font-semibold text-slate-800">
                        {ticket.assigned_to_name || "Not assigned yet"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Last Updated
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDateTime(ticket.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* SLA */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      SLA
                    </h2>

                    <p className="text-xs text-slate-400">
                      Service timeline
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div
                    className={`rounded-xl border p-4 ${
                      slaStatus === "BREACHED"
                        ? "border-red-200 bg-red-50"
                        : slaStatus === "AT_RISK"
                        ? "border-orange-200 bg-orange-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      SLA Status
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {String(slaStatus).replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        First Response Due
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDateTime(
                          ticket.sla?.first_response_due_at
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Resolution Due
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDateTime(
                          ticket.sla?.resolution_due_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Current Status
                    </h2>

                    <p className="text-xs text-slate-400">
                      Request progress
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border ${getStatusStyle(
                        ticket.status
                      )}`}
                    >
                      <TicketIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Current status
                      </p>

                      <p className="font-bold text-slate-900">
                        {formatStatus(ticket.status)}
                      </p>
                    </div>
                  </div>

                  {ticket.status === "PENDING_STUDENT" &&
                    ticket.pending_reason && (
                      <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <p className="text-xs font-semibold text-orange-700">
                          Action required
                        </p>

                        <p className="mt-1 text-sm text-orange-800">
                          {ticket.pending_reason}
                        </p>
                      </div>
                    )}

                  {ticket.resolution_summary && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-xs font-semibold text-green-700">
                        Resolution
                      </p>

                      <p className="mt-1 text-sm text-green-800">
                        {ticket.resolution_summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DESCRIPTION + ACTIVITY */}
            <div className="mt-5 grid gap-5 lg:grid-cols-3">

              {/* DESCRIPTION */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Description
                    </h2>

                    <p className="text-xs text-slate-400">
                      Details provided with your request
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {ticket.description}
                  </p>
                </div>
              </div>

              {/* ACTIVITY */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Activity
                    </h2>

                    <p className="text-xs text-slate-400">
                      Ticket history
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  {!ticket.activities ||
                  ticket.activities.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No activity available.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {ticket.activities.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="relative flex gap-3"
                        >
                          {index <
                            ticket.activities!.length - 1 && (
                            <div className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />
                          )}

                          <div className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-100" />

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {activity.description}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COMMENTS */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MessageCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Conversation
                    </h2>

                    <p className="text-xs text-slate-400">
                      Communicate with the support team
                    </p>
                  </div>
                </div>
              </div>

              {/* COMMENT LIST */}
              <div className="divide-y divide-slate-100">
                {!ticket.comments ||
                ticket.comments.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <MessageCircle className="h-6 w-6" />
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No messages yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Send a message to communicate with the support team.
                    </p>
                  </div>
                ) : (
                  ticket.comments
                    .filter((item) => !item.is_internal)
                    .map((item) => {
                      const isCurrentUser =
                        item.user_id === user.id;

                      return (
                        <div
                          key={item.id}
                          className="flex gap-3 p-5 sm:p-6"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isCurrentUser
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {(
                              item.user_name ||
                              (isCurrentUser
                                ? user.name
                                : "S")
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.user_name ||
                                  (isCurrentUser
                                    ? user.name
                                    : "Support Team")}
                              </p>

                              {isCurrentUser && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                  You
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(item.created_at)}
                            </p>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {item.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* ADD COMMENT */}
              {ticket.status !== "CLOSED" && (
                <div className="border-t border-slate-100 p-5 sm:p-6">
                  <div className="flex gap-3">
                    <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 sm:flex">
                      {user?.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>

                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a message to the support team..."
                        rows={4}
                        maxLength={2000}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-400">
                          {comment.length}/2000 characters
                        </p>

                        <button
                          onClick={sendComment}
                          disabled={
                            !comment.trim() || sendingComment
                          }
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />

                          {sendingComment
                            ? "Sending..."
                            : "Send Message"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ATTACHMENTS */}
            {ticket.attachments &&
              ticket.attachments.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Paperclip className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Attachments
                      </h2>

                      <p className="text-xs text-slate-400">
                        Files attached to this ticket
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Paperclip className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {attachment.file_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* BOTTOM INFO */}
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Need more help?
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Continue the conversation above if you need to provide
                  additional information to the support team.
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}