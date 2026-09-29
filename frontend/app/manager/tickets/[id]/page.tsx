"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  Info,
  Menu,
  MessageCircle,
  RefreshCw,
  Send,
  Shield,
  Ticket,
  UserCheck,
  Users,
  X,
  XCircle,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  addTicketComment,
  assignTicket,
  closeTicket,
  getStaffTicketById,
  reopenTicket,
  resolveTicket,
  updateTicketPriority,
  updateTicketStatus,
  type StaffTicketDetails,
  type TicketActivity,
  type TicketComment,
  type TicketPriority,
  type TicketSLA,
  type TicketStatus,
} from "@/lib/ticket";

import {
  getAllStaff,
  type Staff,
} from "@/lib/staff";

/* =========================================================
   TYPES
========================================================= */

type SLAStatusValue =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED"
  | "COMPLETED";

/* =========================================================
   STATUS TRANSITIONS
========================================================= */

const STATUS_TRANSITIONS: Record<
  TicketStatus,
  TicketStatus[]
> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: [
    "PENDING_STUDENT",
    "RESOLVED",
  ],
  PENDING_STUDENT: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS"],
};

/* =========================================================
   FORMATTERS
========================================================= */

function formatStatus(
  status?: string | null
) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatPriority(
  priority?: string | null
) {
  if (!priority) return "Unknown";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1).toLowerCase()
  );
}

function formatDateTime(
  date?: string | null
) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(
  status?: string | null
) {
  switch (status) {
    case "OPEN":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "ASSIGNED":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "PENDING_STUDENT":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "border-slate-300 bg-slate-100 text-slate-700";

    case "REOPENED":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getPriorityClass(
  priority?: string | null
) {
  switch (priority) {
    case "LOW":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "MEDIUM":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "URGENT":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getSlaClass(
  status?: string | null
) {
  switch (status) {
    case "ON_TRACK":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "AT_RISK":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "BREACHED":
      return "border-red-200 bg-red-50 text-red-700";

    case "COMPLETED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ManagerTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const { user, loading: authLoading } =
    useAuth();

  const ticketId = Number(params?.id);

  /* =======================================================
     DATA
  ======================================================= */

  const [ticket, setTicket] =
    useState<StaffTicketDetails | null>(null);

  const [sla, setSla] =
    useState<TicketSLA | null>(null);

  const [slaStatus, setSlaStatus] =
    useState<SLAStatusValue | null>(null);

  const [slaAgeLabel, setSlaAgeLabel] =
    useState<string | null>(null);

  const [slaRemainingMinutes, setSlaRemainingMinutes] =
    useState<number | null>(null);

  const [slaOverdueMinutes, setSlaOverdueMinutes] =
    useState<number>(0);

  const [comments, setComments] =
    useState<TicketComment[]>([]);

  const [activities, setActivities] =
    useState<TicketActivity[]>([]);

  const [staff, setStaff] =
    useState<Staff[]>([]);

  /* =======================================================
     UI
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* =======================================================
     MANAGEMENT
  ======================================================= */

  const [selectedStaff, setSelectedStaff] =
    useState("");

  const [selectedPriority, setSelectedPriority] =
    useState<TicketPriority>("MEDIUM");

  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatus>("OPEN");

  const [pendingReason, setPendingReason] =
    useState("");

  const [pendingError, setPendingError] =
    useState("");

  const [resolutionSummary, setResolutionSummary] =
    useState("");

  const [showPendingModal, setShowPendingModal] =
    useState(false);

  const [showResolveModal, setShowResolveModal] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  /* =======================================================
     COMMENTS
  ======================================================= */

  const [comment, setComment] =
    useState("");

  const [isInternal, setIsInternal] =
    useState(false);

  const [sendingComment, setSendingComment] =
    useState(false);

  /* =======================================================
     AUTH
  ======================================================= */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (user.role !== "MANAGER") {
      if (user.role === "STAFF") {
        router.replace("/staff/dashboard");
      } else if (user.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [
    user,
    authLoading,
    router,
  ]);

  /* =======================================================
     LOAD STAFF
  ======================================================= */

  const fetchStaff =
    useCallback(async () => {
      try {
        const data = await getAllStaff();
        setStaff(data);
      } catch (err) {
        console.error(
          "Failed to load staff:",
          err
        );
      }
    }, []);

  /* =======================================================
     LOAD TICKET
  ======================================================= */

  const fetchTicket =
    useCallback(
      async (isRefresh = false) => {
        if (
          !ticketId ||
          Number.isNaN(ticketId)
        ) {
          setError("Invalid ticket ID.");
          setLoading(false);
          return;
        }

        try {
          setError("");

          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          /*
           * IMPORTANT:
           * Manager / Staff details endpoint
           */
          const result =
            await getStaffTicketById(
              ticketId
            );

          setTicket(result.ticket);
          setSla(result.sla || null);
          setComments(result.comments || []);
          setActivities(
            result.activities || []
          );

          /*
           * The current ticket.ts type says
           * slaStatus is string, but backend can
           * return an SLA status object.
           *
           * Handle BOTH forms safely.
           */
          const rawSlaStatus =
            result.slaStatus as unknown;

          if (
            typeof rawSlaStatus ===
            "string"
          ) {
            setSlaStatus(
              rawSlaStatus as SLAStatusValue
            );

            setSlaAgeLabel(null);
            setSlaRemainingMinutes(null);
            setSlaOverdueMinutes(0);
          } else if (
            rawSlaStatus &&
            typeof rawSlaStatus ===
              "object"
          ) {
            const value =
              rawSlaStatus as {
                status?: string;
                remainingMinutes?: number | null;
                overdueMinutes?: number;
                ageing?: {
                  ageLabel?: string;
                };
              };

            setSlaStatus(
              (value.status ||
                null) as SLAStatusValue | null
            );

            setSlaAgeLabel(
              value.ageing?.ageLabel ||
                null
            );

            setSlaRemainingMinutes(
              value.remainingMinutes ??
                null
            );

            setSlaOverdueMinutes(
              value.overdueMinutes || 0
            );
          } else {
            setSlaStatus(null);
            setSlaAgeLabel(null);
            setSlaRemainingMinutes(null);
            setSlaOverdueMinutes(0);
          }

          setSelectedStaff(
            result.ticket.assigned_to
              ? String(
                  result.ticket.assigned_to
                )
              : ""
          );

          setSelectedPriority(
            result.ticket.priority
          );

          setSelectedStatus(
            result.ticket.status
          );

          setResolutionSummary(
            result.ticket
              .resolution_summary || ""
          );
        } catch (err: any) {
          console.error(
            "Failed to load ticket:",
            err
          );

          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load ticket details."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [ticketId]
    );

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      user.role !== "MANAGER"
    ) {
      return;
    }

    fetchStaff();
    fetchTicket();
  }, [
    authLoading,
    user,
    fetchStaff,
    fetchTicket,
  ]);

  /* =======================================================
     STATUS OPTIONS
  ======================================================= */

  const availableStatuses =
    useMemo(() => {
      if (!ticket) return [];

      return [
        ticket.status,
        ...(STATUS_TRANSITIONS[
          ticket.status
        ] || []),
      ];
    }, [ticket]);

  /* =======================================================
     ASSIGN
  ======================================================= */

  const handleAssign = async () => {
    if (!ticket || !selectedStaff) {
      setError(
        "Please select a staff member."
      );
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await assignTicket(
        ticket.id,
        Number(selectedStaff)
      );

      await fetchTicket(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to assign ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     PRIORITY
  ======================================================= */

  const handlePriority = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      await updateTicketPriority(
        ticket.id,
        selectedPriority
      );

      await fetchTicket(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update priority."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const handleStatusUpdate =
    async () => {
      if (!ticket) return;

      if (
        selectedStatus ===
        ticket.status
      ) {
        return;
      }

      if (
        selectedStatus ===
        "PENDING_STUDENT"
      ) {
        setPendingReason("");
        setPendingError("");
        setShowPendingModal(true);
        return;
      }

      try {
        setUpdating(true);
        setError("");

        await updateTicketStatus(
          ticket.id,
          selectedStatus
        );

        await fetchTicket(true);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to update status."
        );

        setSelectedStatus(
          ticket.status
        );
      } finally {
        setUpdating(false);
      }
    };

  /* =======================================================
     PENDING STUDENT
  ======================================================= */

  const handlePendingStatus =
    async () => {
      if (!ticket) return;

      const reason =
        pendingReason.trim();

      if (!reason) {
        setPendingError(
          "Please provide a pending reason."
        );
        return;
      }

      if (reason.length > 1000) {
        setPendingError(
          "Pending reason cannot exceed 1000 characters."
        );
        return;
      }

      try {
        setUpdating(true);
        setPendingError("");
        setError("");

        await updateTicketStatus(
          ticket.id,
          "PENDING_STUDENT",
          reason
        );

        setShowPendingModal(false);
        setPendingReason("");
        setPendingError("");

        await fetchTicket(true);
      } catch (err: any) {
        console.error(
          "Failed to move ticket to Pending Student:",
          err
        );

        setPendingError(
          err?.response?.data?.message ||
            "Failed to update status."
        );
      } finally {
        setUpdating(false);
      }
    };

  /* =======================================================
     RESOLVE
  ======================================================= */

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

      await fetchTicket(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to resolve ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      await closeTicket(ticket.id);

      await fetchTicket(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to close ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     REOPEN
  ======================================================= */

  const handleReopen = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      await reopenTicket(ticket.id);

      await fetchTicket(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to reopen ticket."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     COMMENT
  ======================================================= */

  const handleSendComment =
    async () => {
      if (!ticket || !comment.trim()) {
        return;
      }

      try {
        setSendingComment(true);
        setError("");

        const newComment =
          await addTicketComment(
            ticket.id,
            comment.trim(),
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

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <div className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block" />

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-7xl p-5 sm:p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-4 w-48 rounded bg-slate-200" />

                <div className="h-32 rounded-2xl bg-white" />

                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="h-72 rounded-2xl bg-white" />
                  <div className="h-72 rounded-2xl bg-white" />
                  <div className="h-72 rounded-2xl bg-white" />
                </div>

                <div className="h-72 rounded-2xl bg-white" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <ManagerSidebar
            activePath="/manager/tickets"
          />

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-7xl p-5 sm:p-8">
              <button
                onClick={() =>
                  router.push(
                    "/manager/tickets"
                  )
                }
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tickets
              </button>

              <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <XCircle className="mx-auto h-10 w-10 text-red-500" />

                <h1 className="mt-4 text-xl font-bold text-slate-900">
                  Ticket not found
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {error ||
                    "Unable to load this ticket."}
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
          />

          <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <Brand />

              <button
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarNavigation
              activePath="/manager/tickets"
              onNavigate={() =>
                setMobileMenuOpen(false)
              }
            />

            {/* NO LOGOUT HERE */}
            <div className="shrink-0 border-t border-slate-200 p-4">
              <ManagerUser />
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          APP SHELL
      ===================================================== */}

      <div className="flex min-h-screen">
        {/* EXACT MANAGER SIDEBAR STYLE */}
        <ManagerSidebar
          activePath="/manager/tickets"
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

            {/* MOBILE HEADER */}
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setMobileMenuOpen(true)
                  }
                  className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
                >
                  <Menu className="h-5 w-5 text-slate-600" />
                </button>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Student Support
                  </p>

                  <p className="text-xs text-slate-500">
                    Manager Portal
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  fetchTicket(true)
                }
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>

            {/* =================================================
                BREADCRUMB
            ================================================= */}

            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <button
                onClick={() =>
                  router.push(
                    "/manager/dashboard"
                  )
                }
                className="hover:text-blue-600"
              >
                Dashboard
              </button>

              <span>/</span>

              <button
                onClick={() =>
                  router.push(
                    "/manager/tickets"
                  )
                }
                className="hover:text-blue-600"
              >
                Tickets
              </button>

              <span>/</span>

              <span className="font-medium text-slate-700">
                Ticket Details
              </span>
            </div>

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <button
                    onClick={() =>
                      router.push(
                        "/manager/tickets"
                      )
                    }
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tickets
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-blue-600">
                      #{ticket.ticket_number}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {formatStatus(
                        ticket.status
                      )}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                        ticket.priority
                      )}`}
                    >
                      {formatPriority(
                        ticket.priority
                      )}
                    </span>
                  </div>

                  <h1 className="mt-4 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                    {ticket.subject}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                    <span>
                      Created{" "}
                      <strong className="font-medium text-slate-700">
                        {formatDateTime(
                          ticket.created_at
                        )}
                      </strong>
                    </span>

                    <span className="hidden sm:inline">
                      •
                    </span>

                    <span>
                      Ticket ID{" "}
                      <strong className="font-medium text-slate-700">
                        #{ticket.id}
                      </strong>
                    </span>

                    <span className="hidden sm:inline">
                      •
                    </span>

                    <span>
                      Updated{" "}
                      <strong className="font-medium text-slate-700">
                        {formatDateTime(
                          ticket.updated_at
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    fetchTicket(true)
                  }
                  disabled={refreshing}
                  className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:inline-flex"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Something went wrong
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setError("")
                  }
                  className="rounded-lg p-1 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* =================================================
                THREE MAIN CARDS
            ================================================= */}

            <div className="mb-5 grid gap-6 lg:grid-cols-3">

              {/* =================================================
                  TICKET INFORMATION
              ================================================= */}

              <InfoCard
                icon={FileText}
                title="Ticket Information"
                subtitle="Student and ticket details"
              >
                <DetailRow
                  label="Category"
                  value={
                    ticket.category_name ||
                    "—"
                  }
                />

                <DetailRow
                  label="Student"
                  value={
                    ticket.student_name ||
                    "—"
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    ticket.student_email ||
                    "—"
                  }
                  breakValue
                />

                <DetailRow
                  label="Phone"
                  value={
                    ticket.student_phone ||
                    "—"
                  }
                />

                <DetailRow
                  label="Assigned Staff"
                  value={
                    ticket.assigned_to_name ||
                    "Unassigned"
                  }
                />

                <DetailRow
                  label="Last Updated"
                  value={formatDateTime(
                    ticket.updated_at
                  )}
                />
              </InfoCard>

              {/* =================================================
                  SLA
              ================================================= */}

              <InfoCard
                icon={Clock3}
                title="SLA"
                subtitle="Service level information"
              >
                <div className="mb-5">
                  <p className="mb-2 text-xs font-medium text-slate-400">
                    SLA Status
                  </p>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSlaClass(
                      slaStatus
                    )}`}
                  >
                    {slaStatus
                      ? formatStatus(
                          slaStatus
                        )
                      : "Not Available"}
                  </span>
                </div>

                <DetailRow
                  label="First Response Due"
                  value={formatDateTime(
                    sla?.first_response_due_at
                  )}
                />

                <DetailRow
                  label="First Responded"
                  value={formatDateTime(
                    sla?.first_responded_at
                  )}
                />

                <DetailRow
                  label="Resolution Due"
                  value={formatDateTime(
                    sla?.resolution_due_at
                  )}
                />

                <DetailRow
                  label="Resolved At"
                  value={formatDateTime(
                    sla?.resolved_at
                  )}
                />

                {slaAgeLabel && (
                  <DetailRow
                    label="Ageing"
                    value={slaAgeLabel}
                  />
                )}

                {slaRemainingMinutes !==
                  null && (
                  <DetailRow
                    label={
                      slaRemainingMinutes >=
                      0
                        ? "Remaining"
                        : "Overdue"
                    }
                    value={
                      slaRemainingMinutes >=
                      0
                        ? `${slaRemainingMinutes} minutes`
                        : `${slaOverdueMinutes} minutes`
                    }
                  />
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      First Response
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        sla?.first_response_breached
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {sla?.first_response_breached
                        ? "Breached"
                        : "On Track"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Resolution
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        sla?.resolution_breached
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {sla?.resolution_breached
                        ? "Breached"
                        : "On Track"}
                    </p>
                  </div>
                </div>
              </InfoCard>

              {/* =================================================
                  MANAGEMENT
              ================================================= */}

              <InfoCard
                icon={Shield}
                title="Ticket Management"
                subtitle="Manage assignment and status"
              >
                {/* STAFF */}
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned Staff
                  </label>

                  <select
                    value={selectedStaff}
                    onChange={(e) =>
                      setSelectedStaff(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select staff
                    </option>

                    {staff
                      .filter(
                        (member) =>
                          member.is_active
                      )
                      .map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={handleAssign}
                    disabled={
                      updating ||
                      !selectedStaff ||
                      selectedStaff ===
                        String(
                          ticket.assigned_to ||
                            ""
                        )
                    }
                    className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Assign Staff
                    </span>
                  </button>
                </div>

                {/* PRIORITY */}
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </label>

                  <select
                    value={selectedPriority}
                    onChange={(e) =>
                      setSelectedPriority(
                        e.target
                          .value as TicketPriority
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>

                  <button
                    onClick={
                      handlePriority
                    }
                    disabled={
                      updating ||
                      selectedPriority ===
                        ticket.priority
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Update Priority
                  </button>
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </label>

                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(
                        e.target
                          .value as TicketStatus
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {availableStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatStatus(
                            status
                          )}
                          {status ===
                          ticket.status
                            ? " (Current)"
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    onClick={
                      handleStatusUpdate
                    }
                    disabled={
                      updating ||
                      selectedStatus ===
                        ticket.status
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Update Status
                  </button>
                </div>

                {/* ACTIONS */}
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="grid gap-2">
                    {ticket.status ===
                      "IN_PROGRESS" && (
                      <button
                        onClick={() =>
                          setShowResolveModal(
                            true
                          )
                        }
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolve Ticket
                      </button>
                    )}

                    {ticket.status ===
                      "RESOLVED" && (
                      <button
                        onClick={handleClose}
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Close Ticket
                      </button>
                    )}

                    {ticket.status ===
                      "CLOSED" && (
                      <button
                        onClick={handleReopen}
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>
              </InfoCard>
            </div>

            {/* =================================================
                DESCRIPTION + ACTIVITY
            ================================================= */}

            <div className="mb-6 grid gap-6 lg:grid-cols-3">

              {/* DESCRIPTION */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Ticket Description
                      </h2>

                      <p className="text-xs text-slate-500">
                        Original request from the student
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                    {ticket.description ||
                      "No description provided."}
                  </p>

                  {ticket.pending_reason && (
                    <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-orange-600" />

                        <div>
                          <p className="text-sm font-semibold text-orange-800">
                            Pending Reason
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-orange-700">
                            {
                              ticket.pending_reason
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {ticket.resolution_summary && (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            Resolution Summary
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-700">
                            {
                              ticket.resolution_summary
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ACTIVITY */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Activity
                      </h2>

                      <p className="text-xs text-slate-500">
                        Ticket history
                      </p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-5 sm:p-6">
                  {activities.length ===
                  0 ? (
                    <EmptyState text="No activity recorded yet." />
                  ) : (
                    <div className="space-y-6">
                      {activities.map(
                        (
                          activity,
                          index
                        ) => (
                          <div
                            key={
                              activity.id
                            }
                            className="relative flex gap-3"
                          >
                            {index <
                              activities.length -
                                1 && (
                              <div className="absolute left-[7px] top-7 h-[calc(100%+12px)] w-px bg-slate-200" />
                            )}

                            <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-blue-200 bg-blue-600" />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {formatStatus(
                                  activity.activity_type
                                )}
                              </p>

                              <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                                {
                                  activity.description
                                }
                              </p>

                              <p className="mt-2 text-xs text-slate-400">
                                {activity.user_name ||
                                  "System"}{" "}
                                •{" "}
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
            </div>

            {/* =================================================
                CONVERSATION
            ================================================= */}

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Conversation
                      </h2>

                      <p className="text-xs text-slate-500">
                        Student and support communication
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {comments.length}{" "}
                    {comments.length === 1
                      ? "message"
                      : "messages"}
                  </span>
                </div>
              </div>

              {/* COMMENTS */}
              <div className="max-h-[600px] space-y-5 overflow-y-auto p-5 sm:p-6">
                {comments.length ===
                0 ? (
                  <EmptyState text="No comments yet." />
                ) : (
                  comments.map(
                    (item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 sm:p-5 ${
                          item.is_internal
                            ? "border-amber-200 bg-amber-50/60"
                            : "border-slate-200 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              item.is_internal
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {item.user_name
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.user_name ||
                                    "Unknown User"}
                                </p>

                                {item.user_role && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                    {
                                      item.user_role
                                    }
                                  </span>
                                )}

                                {item.is_internal && (
                                  <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                                    Internal Note
                                  </span>
                                )}
                              </div>

                              <span className="text-xs text-slate-400">
                                {formatDateTime(
                                  item.created_at
                                )}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                              {
                                item.comment
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              {/* COMMENT INPUT */}
              <div className="border-t border-slate-100 p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setIsInternal(false)
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      !isInternal
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Public Comment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIsInternal(true)
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      isInternal
                        ? "bg-amber-100 text-amber-700"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Internal Note
                  </button>
                </div>

                <div
                  className={`overflow-hidden rounded-2xl border ${
                    isInternal
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-slate-200"
                  }`}
                >
                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder={
                      isInternal
                        ? "Write an internal note..."
                        : "Write a response to the student..."
                    }
                    className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                  />

                  <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                      {isInternal
                        ? "Visible only to staff and managers."
                        : "Visible in the student conversation."}
                    </p>

                    <button
                      onClick={
                        handleSendComment
                      }
                      disabled={
                        sendingComment ||
                        !comment.trim()
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${
                        isInternal
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <Send className="h-4 w-4" />

                      {sendingComment
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* HELP */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Info className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Ticket management
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Manage assignment, priority,
                    status and communication from
                    this page. Internal notes are
                    visible only to support staff and
                    managers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================
          PENDING MODAL
      ===================================================== */}

      {showPendingModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          {/* BACKDROP */}
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => {
              if (!updating) {
                setShowPendingModal(false);
                setPendingReason("");
                setPendingError("");
                setSelectedStatus(ticket.status);
              }
            }}
            className="absolute inset-0"
          />

          {/* MODAL */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Move to Pending Student
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Provide the reason why the ticket requires
                  action or information from the student.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!updating) {
                    setShowPendingModal(false);
                    setPendingReason("");
                    setPendingError("");
                    setSelectedStatus(ticket.status);
                  }
                }}
                disabled={updating}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="space-y-4 p-5">
              {pendingError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{pendingError}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Pending Reason
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  value={pendingReason}
                  onChange={(event) => {
                    setPendingReason(
                      event.target.value
                    );

                    if (pendingError) {
                      setPendingError("");
                    }
                  }}
                  placeholder="Enter the reason..."
                  rows={4}
                  maxLength={1000}
                  disabled={updating}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />

                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] text-slate-400">
                    {pendingReason.length}/1000
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => {
                  if (!updating) {
                    setShowPendingModal(false);
                    setPendingReason("");
                    setPendingError("");
                    setSelectedStatus(ticket.status);
                  }
                }}
                disabled={updating}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePendingStatus}
                disabled={
                  updating ||
                  !pendingReason.trim()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "Updating..."
                  : "Move to Pending Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RESOLVE MODAL
      ===================================================== */}

      {showResolveModal && (
        <Modal
          title="Resolve Ticket"
          description="Add a clear resolution summary before resolving the ticket."
          onClose={() =>
            setShowResolveModal(false)
          }
        >
          <textarea
            value={resolutionSummary}
            onChange={(e) =>
              setResolutionSummary(
                e.target.value
              )
            }
            rows={5}
            placeholder="Describe how the issue was resolved..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() =>
                setShowResolveModal(false)
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleResolve}
              disabled={updating}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {updating
                ? "Resolving..."
                : "Resolve Ticket"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR
   SAME MANAGER SHELL
========================================================= */

function ManagerSidebar({
  activePath,
}: {
  activePath: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-5">
        <Brand />
      </div>

      <SidebarNavigation
        activePath={activePath}
      />

      {/* NO LOGOUT */}
      <div className="shrink-0 border-t border-slate-200 p-4">
        <ManagerUser />
      </div>
    </aside>
  );
}

/* =========================================================
   BRAND
========================================================= */

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <GraduationCap className="h-6 w-6" />
      </div>

      <div>
        <p className="font-bold text-slate-900">
          Student Support
        </p>

        <p className="text-xs text-slate-500">
          Manager Portal
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

function SidebarNavigation({
  activePath,
  onNavigate,
}: {
  activePath: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  const items = [
    {
      label: "Dashboard",
      path: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tickets",
      path: "/manager/tickets",
      icon: Ticket,
    },
    {
      label: "Staff",
      path: "/manager/staff",
      icon: Users,
    },
    {
      label: "Categories",
      path: "/manager/categories",
      icon: Filter,
    },
  ];

  return (
    <nav className="flex-1 overflow-y-auto p-4">
      <p className="mb-3 px-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Management
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            activePath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                onNavigate?.();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  active
                    ? "text-blue-600"
                    : "text-slate-400"
                }`}
              />

              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* =========================================================
   USER AREA
   NO LOGOUT
========================================================= */

function ManagerUser() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
        {user?.name
          ?.charAt(0)
          ?.toUpperCase() || "M"}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {user?.name || "Manager"}
        </p>

        <p className="text-xs text-slate-500">
          Manager
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              {title}
            </h2>

            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  breakValue = false,
}: {
  label: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-0">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {label}
        </span>

        <span
          className={`text-sm font-medium text-slate-700 sm:text-right ${
            breakValue
              ? "break-all"
              : "break-words"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}