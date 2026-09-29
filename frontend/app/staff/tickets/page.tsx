"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  getAllTickets,
  type TicketListItem,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/ticket";

const PAGE_LIMIT = 10;

export default function StaffTicketsPage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    logout,
  } = useAuth();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] =
    useState<TicketPriority | "">("");
  const [slaStatus, setSlaStatus] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* =========================================================
     AUTH
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
  }, [user, authLoading, router]);

  /* =========================================================
     LOAD TICKETS
  ========================================================= */

  useEffect(() => {
    if (authLoading || !user || user.role !== "STAFF") {
      return;
    }

    fetchTickets();
  }, [
    user,
    authLoading,
    page,
    status,
    priority,
    slaStatus,
  ]);

  const fetchTickets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const response = await getAllTickets({
        assignedTo: user.id,

        page,
        limit: PAGE_LIMIT,

        search: search.trim() || undefined,

        status: status || undefined,

        priority: priority || undefined,

        slaStatus: slaStatus || undefined,

        sortBy: "created_at",
        sortOrder: "desc",
      });

      setTickets(response.tickets);

      setTotal(response.pagination.total);

      setTotalPages(
        response.pagination.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Failed to load staff tickets:",
        error
      );

      setTickets([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSlaStatus("");
    setPage(1);
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatStatus = (value: string) => {
    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusStyle = (
    value: TicketStatus
  ) => {
    switch (value) {
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
    value: TicketPriority
  ) => {
    switch (value) {
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
    value?: string | null
  ) => {
    switch (value) {
      case "BREACHED":
        return "text-red-600";

      case "AT_RISK":
        return "text-amber-600";

      case "ON_TRACK":
        return "text-green-600";

      case "COMPLETED":
        return "text-slate-500";

      default:
        return "text-slate-500";
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading tickets...
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Ticket className="h-5 w-5" />
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
        <div className="fixed inset-x-0 top-16 z-20 border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden">

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
              <Ticket className="h-5 w-5" />
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
              <Ticket className="h-5 w-5" />
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

            {/* Dashboard */}

            <button
              type="button"
              onClick={() =>
                router.push("/staff/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            {/* My Tickets */}

            <button
              type="button"
              onClick={() =>
                router.push("/staff/tickets")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            {/* All Tickets */}

            <button
              type="button"
              onClick={() =>
                router.push("/staff/tickets/all")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <FileText className="h-5 w-5" />
              All Tickets
            </button>

          </nav>

          {/* USER */}

          <div className="shrink-0 border-t border-slate-200 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  Staff
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600"
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

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-6">

              <p className="text-sm font-medium text-blue-600">
                Staff Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                My Tickets
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage tickets assigned to you.
              </p>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              {/* TOTAL */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      My Tickets
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading ? "—" : total}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Ticket className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* ACTIVE */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      Active
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : tickets.filter(
                            (ticket) =>
                              ![
                                "RESOLVED",
                                "CLOSED",
                              ].includes(
                                ticket.status
                              )
                          ).length}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* OVERDUE */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      Overdue
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : tickets.filter(
                            (ticket) =>
                              ticket.slaStatus
                                ?.status ===
                              "BREACHED"
                          ).length}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                FILTER BAR
            ================================================= */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex flex-col gap-3 lg:flex-row">

                {/* SEARCH */}

                <div className="relative min-w-0 flex-1">

                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search ticket number or subject..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* STATUS */}

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target.value as
                        | TicketStatus
                        | ""
                    );
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="OPEN">
                    Open
                  </option>

                  <option value="ASSIGNED">
                    Assigned
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="PENDING_STUDENT">
                    Pending Student
                  </option>

                  <option value="RESOLVED">
                    Resolved
                  </option>

                  <option value="CLOSED">
                    Closed
                  </option>

                  <option value="REOPENED">
                    Reopened
                  </option>
                </select>

                {/* PRIORITY */}

                <select
                  value={priority}
                  onChange={(event) => {
                    setPriority(
                      event.target.value as
                        | TicketPriority
                        | ""
                    );
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    All Priority
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="LOW">
                    Low
                  </option>
                </select>

                {/* SLA */}

                <select
                  value={slaStatus}
                  onChange={(event) => {
                    setSlaStatus(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    All SLA
                  </option>

                  <option value="ON_TRACK">
                    On Track
                  </option>

                  <option value="AT_RISK">
                    At Risk
                  </option>

                  <option value="BREACHED">
                    Breached
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>

                {/* SEARCH BUTTON */}

                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>

                {/* REFRESH */}

                <button
                  type="button"
                  onClick={fetchTickets}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loading
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                </button>

              </div>

              {/* CLEAR */}

              {(search ||
                status ||
                priority ||
                slaStatus) && (
                <div className="mt-3 flex justify-end">

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600"
                  >
                    Clear filters
                  </button>

                </div>
              )}

            </div>

            {/* =================================================
                TICKET TABLE
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* TABLE HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

                <div>

                  <h2 className="font-semibold text-slate-900">
                    Assigned Tickets
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {loading
                      ? "Loading tickets..."
                      : `${total} ticket${
                          total === 1
                            ? ""
                            : "s"
                        } found`}
                  </p>

                </div>

              </div>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <div className="space-y-3 p-6">

                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-xl bg-slate-50 p-4"
                      >
                        <div className="h-4 w-1/4 rounded bg-slate-200" />

                        <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />

                        <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
                      </div>
                    )
                  )}

                </div>
              ) : tickets.length === 0 ? (

                /* =================================================
                    EMPTY
                ================================================= */

                <div className="px-6 py-16 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Ticket className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No tickets found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    No tickets match your current filters.
                  </p>

                  {(search ||
                    status ||
                    priority ||
                    slaStatus) && (
                    <button
                      type="button"
                      onClick={
                        handleClearFilters
                      }
                      className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Clear filters
                    </button>
                  )}

                </div>

              ) : (

                <>
                  {/* =================================================
                      DESKTOP TABLE
                  ================================================= */}

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px]">

                      <thead>

                        <tr className="border-b border-slate-100 bg-slate-50/70">

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ticket #
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Subject
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Category
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Priority
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            SLA
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {tickets.map(
                          (ticket) => (
                            <tr
                              key={ticket.id}
                              onClick={() =>
                                router.push(
                                  `/staff/tickets/${ticket.id}`
                                )
                              }
                              className="cursor-pointer transition hover:bg-slate-50"
                            >

                              {/* TICKET */}

                              <td className="px-6 py-4">

                                <span className="text-xs font-semibold text-blue-600">
                                  {
                                    ticket.ticket_number
                                  }
                                </span>

                              </td>

                              {/* SUBJECT */}

                              <td className="max-w-[300px] px-6 py-4">

                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {
                                    ticket.subject
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Created{" "}
                                  {formatDate(
                                    ticket.created_at
                                  )}
                                </p>

                              </td>

                              {/* CATEGORY */}

                              <td className="px-6 py-4">

                                <span className="text-sm text-slate-600">
                                  {
                                    ticket.category_name ||
                                    "—"
                                  }
                                </span>

                              </td>

                              {/* STATUS */}

                              <td className="px-6 py-4">

                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                    ticket.status
                                  )}`}
                                >
                                  {formatStatus(
                                    ticket.status
                                  )}
                                </span>

                              </td>

                              {/* PRIORITY */}

                              <td className="px-6 py-4">

                                <span
                                  className={`text-xs font-bold ${getPriorityStyle(
                                    ticket.priority
                                  )}`}
                                >
                                  {
                                    ticket.priority
                                  }
                                </span>

                              </td>

                              {/* SLA */}

                              <td className="px-6 py-4">

                                <div>

                                  <span
                                    className={`text-xs font-semibold ${getSlaStyle(
                                      ticket
                                        .slaStatus
                                        ?.status
                                    )}`}
                                  >
                                    {ticket
                                      .slaStatus
                                      ?.status
                                      ? formatStatus(
                                          ticket
                                            .slaStatus
                                            .status
                                        )
                                      : "—"}
                                  </span>

                                  {ticket
                                    .slaStatus
                                    ?.ageing
                                    ?.ageLabel && (
                                    <p className="mt-1 text-[11px] text-slate-400">
                                      {
                                        ticket
                                          .slaStatus
                                          .ageing
                                          .ageLabel
                                      }
                                    </p>
                                  )}

                                </div>

                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* =================================================
                      MOBILE CARDS
                  ================================================= */}

                  <div className="divide-y divide-slate-100 md:hidden">

                    {tickets.map(
                      (ticket) => (
                        <button
                          type="button"
                          key={ticket.id}
                          onClick={() =>
                            router.push(
                              `/staff/tickets/${ticket.id}`
                            )
                          }
                          className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                        >

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Ticket className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="text-xs font-semibold text-blue-600">
                                {
                                  ticket.ticket_number
                                }
                              </span>

                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(
                                  ticket.status
                                )}`}
                              >
                                {formatStatus(
                                  ticket.status
                                )}
                              </span>

                            </div>

                            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                              {
                                ticket.subject
                              }
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">

                              <span className="text-slate-500">
                                {
                                  ticket.category_name ||
                                  "No category"
                                }
                              </span>

                              <span
                                className={`font-semibold ${getPriorityStyle(
                                  ticket.priority
                                )}`}
                              >
                                {
                                  ticket.priority
                                }
                              </span>

                              <span
                                className={`font-semibold ${getSlaStyle(
                                  ticket
                                    .slaStatus
                                    ?.status
                                )}`}
                              >
                                {ticket
                                  .slaStatus
                                  ?.status
                                  ? formatStatus(
                                      ticket
                                        .slaStatus
                                        .status
                                    )
                                  : "—"}
                              </span>

                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                              Created{" "}
                              {formatDate(
                                ticket.created_at
                              )}
                            </p>

                          </div>

                          <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />

                        </button>
                      )
                    )}

                  </div>

                </>

              )}

              {/* =================================================
                  PAGINATION
              ================================================= */}

              {!loading &&
                tickets.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <p className="text-xs text-slate-500">
                      Page {page} of{" "}
                      {totalPages}
                    </p>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() =>
                          setPage(
                            (current) =>
                              Math.max(
                                1,
                                current - 1
                              )
                          )
                        }
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={
                          page >= totalPages
                        }
                        onClick={() =>
                          setPage(
                            (current) =>
                              Math.min(
                                totalPages,
                                current + 1
                              )
                          )
                        }
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>

                    </div>

                  </div>
                )}

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}