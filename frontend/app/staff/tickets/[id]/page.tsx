"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Send,
  Ticket as TicketIcon,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  getStaffTicketById,
  addTicketComment,
  updateTicketStatus,
  updateTicketPriority,
  resolveTicket,
  closeTicket,
  reopenTicket,
  type StaffTicketDetails,
  type TicketComment,
  type TicketActivity,
  type TicketSLA,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/ticket";

export default function StaffTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const {
    user,
    loading: authLoading,
    logout,
  } = useAuth();

  const ticketId = Number(params.id);

  const [ticket, setTicket] =
    useState<StaffTicketDetails | null>(null);

  const [sla, setSla] =
    useState<TicketSLA | null>(null);

  // FIX: Store SLA status separately
  const [slaStatus, setSlaStatus] =
    useState<string | null>(null);

  const [comments, setComments] =
    useState<TicketComment[]>([]);

  const [activities, setActivities] =
    useState<TicketActivity[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [sendingComment, setSendingComment] =
    useState(false);

  const [comment, setComment] =
    useState("");

  const [isInternal, setIsInternal] =
    useState(false);

  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatus | "">("");

  const [selectedPriority, setSelectedPriority] =
    useState<TicketPriority | "">("");

  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [showPriorityMenu, setShowPriorityMenu] =
    useState(false);

  const [showPendingModal, setShowPendingModal] =
    useState(false);

  const [pendingReason, setPendingReason] =
    useState("");

  const [showResolveModal, setShowResolveModal] =
    useState(false);

  const [resolutionSummary, setResolutionSummary] =
    useState("");

  /* =========================================================
     LOAD TICKET
  ========================================================= */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (user.role !== "STAFF") {
      if (user.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else if (user.role === "MANAGER") {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/");
      }

      return;
    }

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      setError("Invalid ticket ID.");
      setLoading(false);
      return;
    }

    fetchTicket();
  }, [
    user,
    authLoading,
    router,
    ticketId,
  ]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getStaffTicketById(ticketId);

      setTicket(response.ticket);

      setSla(response.sla ?? null);

      // FIX:
      // Use the dedicated slaStatus from the API.
      // Fallback to sla.status if needed.
      setSlaStatus(
        response.slaStatus ??
          response.sla?.status ??
          null
      );

      setComments(response.comments ?? []);

      setActivities(response.activities ?? []);

      setSelectedStatus(
        response.ticket.status
      );

      setSelectedPriority(
        response.ticket.priority
      );
    } catch (err: any) {
      console.error(
        "Failed to load ticket:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load ticket."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatStatus = (
    status?: string | null
  ) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatDate = (
    date?: string | null
  ) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    date?: string | null
  ) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusStyle = (
    status?: string | null
  ) => {
    switch (status) {
      case "OPEN":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "ASSIGNED":
        return "border-purple-200 bg-purple-50 text-purple-700";

      case "IN_PROGRESS":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "PENDING_STUDENT":
        return "border-orange-200 bg-orange-50 text-orange-700";

      case "RESOLVED":
        return "border-green-200 bg-green-50 text-green-700";

      case "CLOSED":
        return "border-slate-200 bg-slate-100 text-slate-600";

      case "REOPENED":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  const getPriorityStyle = (
    priority?: string | null
  ) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600";

      case "HIGH":
        return "text-orange-600";

      case "MEDIUM":
        return "text-amber-600";

      case "LOW":
        return "text-slate-500";

      default:
        return "text-slate-500";
    }
  };

  const getSlaStyle = (
    status?: string | null
  ) => {
    switch (status) {
      case "BREACHED":
        return "border-red-200 bg-red-50 text-red-700";

      case "AT_RISK":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "ON_TRACK":
        return "border-green-200 bg-green-50 text-green-700";

      case "COMPLETED":
        return "border-slate-200 bg-slate-100 text-slate-600";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  /* =========================================================
     AVAILABLE STATUS TRANSITIONS
  ========================================================= */

  const availableStatuses =
    useMemo(() => {
      if (!ticket) return [];

      switch (ticket.status) {
        case "OPEN":
          return ["ASSIGNED"] as TicketStatus[];

        case "ASSIGNED":
          return ["IN_PROGRESS"] as TicketStatus[];

        case "IN_PROGRESS":
          return [
            "PENDING_STUDENT",
            "RESOLVED",
          ] as TicketStatus[];

        case "PENDING_STUDENT":
          return ["IN_PROGRESS"] as TicketStatus[];

        case "RESOLVED":
          return ["CLOSED"] as TicketStatus[];

        case "CLOSED":
          return ["REOPENED"] as TicketStatus[];

        case "REOPENED":
          return ["IN_PROGRESS"] as TicketStatus[];

        default:
          return [];
      }
    }, [ticket]);

  /* =========================================================
     STATUS UPDATE
  ========================================================= */

  const handleStatusChange = async (
    newStatus: TicketStatus
  ) => {
    if (!ticket) return;

    setShowStatusMenu(false);

    if (newStatus === "PENDING_STUDENT") {
      setPendingReason(
        ticket.pending_reason || ""
      );

      setShowPendingModal(true);
      return;
    }

    if (newStatus === "RESOLVED") {
      setResolutionSummary(
        ticket.resolution_summary || ""
      );

      setShowResolveModal(true);
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await updateTicketStatus(
        ticket.id,
        newStatus
      );

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update status."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     PENDING
  ========================================================= */

  const handlePending = async () => {
    if (!ticket) return;

    if (!pendingReason.trim()) {
      setError(
        "Please provide a pending reason."
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await updateTicketStatus(
        ticket.id,
        "PENDING_STUDENT",
        pendingReason.trim()
      );

      setShowPendingModal(false);
      setPendingReason("");

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update status."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     RESOLVE
  ========================================================= */

  const handleResolve = async () => {
    if (!ticket) return;

    if (!resolutionSummary.trim()) {
      setError(
        "Please provide a resolution summary."
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await resolveTicket(
        ticket.id,
        resolutionSummary.trim()
      );

      setShowResolveModal(false);
      setResolutionSummary("");

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to resolve ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      await closeTicket(ticket.id);

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to close ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     REOPEN
  ========================================================= */

  const handleReopen = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      await reopenTicket(ticket.id);

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to reopen ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     PRIORITY
  ========================================================= */

  const handlePriorityChange = async (
    newPriority: TicketPriority
  ) => {
    if (!ticket) return;

    setShowPriorityMenu(false);

    if (newPriority === ticket.priority) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await updateTicketPriority(
        ticket.id,
        newPriority
      );

      await fetchTicket();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update priority."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     COMMENT
  ========================================================= */

  const handleSendComment = async () => {
    if (!ticket) return;

    const trimmedComment =
      comment.trim();

    if (!trimmedComment) {
      return;
    }

    try {
      setSendingComment(true);
      setError("");

      const newComment =
        await addTicketComment(
          ticket.id,
          trimmedComment,
          isInternal
        );

      setComments((current) => [
        ...current,
        newComment,
      ]);

      setComment("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to add comment."
      );
    } finally {
      setSendingComment(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block" />

          <main className="flex min-w-0 flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading ticket...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load ticket
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "The requested ticket could not be found."}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={fetchTicket}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <TicketIcon className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              Student Support
            </p>

            <p className="text-[11px] text-slate-400">
              Staff Portal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileMenu(!mobileMenu)
          }
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {mobileMenu ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                router.push("/staff/dashboard");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                router.push("/staff/tickets");
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <TicketIcon className="h-5 w-5" />
              My Tickets
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                router.push("/staff/tickets/all");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-5 w-5" />
              All Tickets
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* =====================================================
          PAGE
      ===================================================== */}

      <div className="flex min-h-screen">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">

          {/* BRAND */}

          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <TicketIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Student Support
              </p>

              <p className="text-xs text-slate-400">
                Staff Portal
              </p>
            </div>
          </div>

          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 p-4">
            <button
              type="button"
              onClick={() =>
                router.push("/staff/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/staff/tickets")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <TicketIcon className="h-5 w-5" />
              My Tickets
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/staff/tickets/all")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-5 w-5" />
              All Tickets
            </button>
          </nav>

          {/* USER */}

          <div className="shrink-0 border-t border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  Staff
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl p-5 sm:p-8">

            {/* BACK */}

            <button
              type="button"
              onClick={() =>
                router.push("/staff/tickets")
              }
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Tickets
            </button>

            {/* =================================================
                HEADER CARD
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-600">
                      {ticket.ticket_number}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                        ticket.status
                      )}`}
                    >
                      {formatStatus(
                        ticket.status
                      )}
                    </span>
                  </div>

                  <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {ticket.subject}
                  </h1>

                  <p className="mt-2 text-xs text-slate-400">
                    Created{" "}
                    {formatDateTime(
                      ticket.created_at
                    )}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-2">

                  {/* STATUS */}

                  <div className="relative">
                    <button
                      type="button"
                      disabled={
                        updating ||
                        availableStatuses.length ===
                          0
                      }
                      onClick={() =>
                        setShowStatusMenu(
                          !showStatusMenu
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}

                      Update Status

                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {showStatusMenu && (
                      <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                        {availableStatuses.map(
                          (status) => (
                            <button
                              type="button"
                              key={status}
                              onClick={() =>
                                handleStatusChange(
                                  status
                                )
                              }
                              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {formatStatus(
                                status
                              )}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* PRIORITY */}

                  <div className="relative">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        setShowPriorityMenu(
                          !showPriorityMenu
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${getPriorityStyle(
                          ticket.priority
                        ).replace(
                          "text-",
                          "bg-"
                        )}`}
                      />

                      Priority

                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {showPriorityMenu && (
                      <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                        {(
                          [
                            "LOW",
                            "MEDIUM",
                            "HIGH",
                            "URGENT",
                          ] as TicketPriority[]
                        ).map(
                          (priority) => (
                            <button
                              type="button"
                              key={priority}
                              onClick={() =>
                                handlePriorityChange(
                                  priority
                                )
                              }
                              className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 ${getPriorityStyle(
                                priority
                              )}`}
                            >
                              {priority}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* CLOSE */}

                  {ticket.status ===
                    "RESOLVED" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleClose}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      Close
                    </button>
                  )}

                  {/* REOPEN */}

                  {ticket.status ===
                    "CLOSED" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleReopen}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="border-b border-red-100 bg-red-50 px-5 py-3 sm:px-6">
                  <div className="flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                INFO GRID
            ================================================= */}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">

              {/* STUDENT */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Student
                    </h2>

                    <p className="text-xs text-slate-400">
                      Request owner
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {ticket.student_name ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-600">
                      {ticket.student_email ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {ticket.student_phone ||
                        "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* TICKET */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <TicketIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Ticket Information
                    </h2>

                    <p className="text-xs text-slate-400">
                      Request details
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Category
                    </span>

                    <span className="text-sm font-medium text-slate-700">
                      {ticket.category_name ||
                        "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Priority
                    </span>

                    <span
                      className={`text-sm font-bold ${getPriorityStyle(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Assigned To
                    </span>

                    <span className="text-right text-sm font-medium text-slate-700">
                      {ticket.assigned_to_name ||
                        "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Updated
                    </span>

                    <span className="text-right text-sm text-slate-600">
                      {formatDate(
                        ticket.updated_at
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* SLA */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      SLA
                    </h2>

                    <p className="text-xs text-slate-400">
                      Service level information
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        Status
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSlaStyle(
                          slaStatus
                        )}`}
                      >
                        {formatStatus(
                          slaStatus
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">
                      First Response Due
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDateTime(
                        sla?.first_response_due_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Resolution Due
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDateTime(
                        sla?.resolution_due_at
                      )}
                    </p>
                  </div>

                  {sla?.first_response_breached && (
                    <p className="text-xs font-semibold text-red-600">
                      First response SLA breached
                    </p>
                  )}

                  {sla?.resolution_breached && (
                    <p className="text-xs font-semibold text-red-600">
                      Resolution SLA breached
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

              {/* LEFT */}

              <div className="space-y-6">

                {/* DESCRIPTION */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Ticket Description
                    </h2>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {ticket.description ||
                        "No description provided."}
                    </p>
                  </div>
                </section>

                {/* PENDING */}

                {ticket.status ===
                  "PENDING_STUDENT" &&
                  ticket.pending_reason && (
                    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

                        <div>
                          <h2 className="text-sm font-bold text-orange-800">
                            Waiting for student
                          </h2>

                          <p className="mt-1 text-sm leading-6 text-orange-700">
                            {
                              ticket.pending_reason
                            }
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                {/* RESOLUTION */}

                {ticket.resolution_summary && (
                  <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                      <div>
                        <h2 className="text-sm font-bold text-green-800">
                          Resolution
                        </h2>

                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-green-700">
                          {
                            ticket.resolution_summary
                          }
                        </p>

                        {ticket.resolved_at && (
                          <p className="mt-2 text-xs text-green-600">
                            Resolved{" "}
                            {formatDateTime(
                              ticket.resolved_at
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* COMMENTS */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Conversation
                        </h2>

                        <p className="text-xs text-slate-400">
                          Student and staff communication
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {comments.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <MessageSquare className="mx-auto h-6 w-6 text-slate-300" />

                        <p className="mt-3 text-sm text-slate-500">
                          No comments yet.
                        </p>
                      </div>
                    ) : (
                      comments.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="px-5 py-5 sm:px-6"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {item.user_name
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                  "U"}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {item.user_name ||
                                      "User"}
                                  </span>

                                  {item.user_role && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                      {
                                        item.user_role
                                      }
                                    </span>
                                  )}

                                  {item.is_internal && (
                                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                      Internal
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {formatDateTime(
                                    item.created_at
                                  )}
                                </p>

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {item.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  {/* COMMENT INPUT */}

                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">
                        Add comment
                      </p>

                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(event) =>
                            setIsInternal(
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        Internal note
                      </label>
                    </div>

                    <textarea
                      value={comment}
                      onChange={(event) =>
                        setComment(
                          event.target.value
                        )
                      }
                      placeholder={
                        isInternal
                          ? "Add an internal note for staff..."
                          : "Write a reply..."
                      }
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={
                          sendingComment ||
                          !comment.trim()
                        }
                        onClick={
                          handleSendComment
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}

                        Send
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT SIDE */}

              <aside className="space-y-6">

                {/* QUICK ACTIONS */}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Ticket Actions
                  </h2>

                  <div className="mt-4 space-y-2">
                    {ticket.status ===
                      "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolutionSummary(
                            ""
                          );
                          setShowResolveModal(
                            true
                          );
                        }}
                        disabled={updating}
                        className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-left text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-5 w-5" />

                        <div>
                          <p className="text-sm font-semibold">
                            Resolve Ticket
                          </p>

                          <p className="text-xs opacity-75">
                            Mark the issue as resolved
                          </p>
                        </div>
                      </button>
                    )}

                    {ticket.status ===
                      "RESOLVED" && (
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={updating}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Lock className="h-5 w-5" />

                        <div>
                          <p className="text-sm font-semibold">
                            Close Ticket
                          </p>

                          <p className="text-xs text-slate-500">
                            Finish this request
                          </p>
                        </div>
                      </button>
                    )}

                    {ticket.status ===
                      "CLOSED" && (
                      <button
                        type="button"
                        onClick={handleReopen}
                        disabled={updating}
                        className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <RefreshCw className="h-5 w-5" />

                        <div>
                          <p className="text-sm font-semibold">
                            Reopen Ticket
                          </p>

                          <p className="text-xs text-blue-600">
                            Continue working on this ticket
                          </p>
                        </div>
                      </button>
                    )}

                    {/* ESCALATION PLACEHOLDER */}

                    <button
                      type="button"
                      onClick={() => {
                        setError(
                          "Escalation action will be connected after confirming the escalation controller request format."
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-red-700 hover:bg-red-100"
                    >
                      <AlertCircle className="h-5 w-5" />

                      <div>
                        <p className="text-sm font-semibold">
                          Escalate Ticket
                        </p>

                        <p className="text-xs text-red-600">
                          Send this ticket for escalation
                        </p>
                      </div>
                    </button>
                  </div>
                </section>

                {/* ACTIVITY */}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Clock3 className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Activity
                      </h2>

                      <p className="text-xs text-slate-400">
                        Ticket history
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {activities.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No activity recorded.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {activities.map(
                          (activity, index) => (
                            <div
                              key={activity.id}
                              className="relative flex gap-3"
                            >
                              {index <
                                activities.length -
                                  1 && (
                                <div className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />
                              )}

                              <div className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500 bg-white" />

                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700">
                                  {activity.description}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {activity.user_name ||
                                    "System"}{" "}
                                  ·{" "}
                                  {formatDateTime(
                                    activity.created_at
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* DATES */}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Timeline
                  </h2>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-slate-400">
                        Created
                      </span>

                      <span className="text-right text-xs font-medium text-slate-600">
                        {formatDateTime(
                          ticket.created_at
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-slate-400">
                        Updated
                      </span>

                      <span className="text-right text-xs font-medium text-slate-600">
                        {formatDateTime(
                          ticket.updated_at
                        )}
                      </span>
                    </div>

                    {ticket.resolved_at && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-400">
                          Resolved
                        </span>

                        <span className="text-right text-xs font-medium text-green-600">
                          {formatDateTime(
                            ticket.resolved_at
                          )}
                        </span>
                      </div>
                    )}

                    {ticket.closed_at && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-400">
                          Closed
                        </span>

                        <span className="text-right text-xs font-medium text-slate-600">
                          {formatDateTime(
                            ticket.closed_at
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================
          PENDING MODAL
      ===================================================== */}

      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">
                Mark as Pending
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Explain what information or action is required from the student.
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={pendingReason}
                onChange={(event) =>
                  setPendingReason(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={1000}
                placeholder="Enter pending reason..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {pendingReason.length}/1000
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowPendingModal(false)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  updating ||
                  !pendingReason.trim()
                }
                onClick={handlePending}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {updating && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Mark Pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RESOLVE MODAL
      ===================================================== */}

      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Resolve Ticket
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Provide a short summary of the solution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowResolveModal(false)
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={resolutionSummary}
                onChange={(event) =>
                  setResolutionSummary(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={2000}
                placeholder="Describe how the issue was resolved..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {resolutionSummary.length}/2000
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowResolveModal(false)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  updating ||
                  !resolutionSummary.trim()
                }
                onClick={handleResolve}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {updating && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}