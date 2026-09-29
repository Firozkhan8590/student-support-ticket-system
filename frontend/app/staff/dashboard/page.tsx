"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  getAllTickets,
  type TicketListItem,
} from "@/lib/ticket";

export default function StaffDashboard() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    logout,
  } = useAuth();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  /* =========================
     AUTH + LOAD TICKETS
  ========================= */

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

    fetchTickets();
  }, [user, authLoading, router]);

  const fetchTickets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const response = await getAllTickets({
        assignedTo: user.id,
        page: 1,
        limit: 100,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      setTickets(response.tickets);
    } catch (error) {
      console.error("Failed to load staff tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     STATS
  ========================= */

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status === "OPEN" ||
      ticket.status === "ASSIGNED"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  const overdueTickets = tickets.filter(
    (ticket) =>
      ticket.slaStatus?.status === "BREACHED"
  ).length;

  /* =========================
     RECENT TICKETS
  ========================= */

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 8);
  }, [tickets]);

  /* =========================
     HELPERS
  ========================= */

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (
    status: TicketListItem["status"]
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
    priority: TicketListItem["priority"]
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

  const getSlaStyle = (status?: string | null) => {
    switch (status) {
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

  /* =========================
     LOADING
  ========================= */

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

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

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-20 border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden">

          <nav className="space-y-1">

            {/* Dashboard */}
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                router.push("/staff/dashboard");
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            {/* My Tickets */}
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                router.push("/staff/tickets");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            {/* All Tickets */}
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

            {/* Logout */}
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
          PAGE WRAPPER
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
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
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
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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

          {/* USER + LOGOUT */}
          <div className="shrink-0 border-t border-slate-200 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user.name?.charAt(0).toUpperCase()}
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
            MAIN CONTENT
        =================================================== */}

        <main className="min-w-0 flex-1">

          <div className="mx-auto max-w-7xl p-5 sm:p-8">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Staff Portal
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Staff Dashboard
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage and resolve student support requests.
                </p>

              </div>

              {/* STAFF INFO */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                <div className="hidden sm:block">

                  <p className="text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    Staff
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      Total Assigned
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : totalTickets}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* OPEN */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      Open
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : openTickets}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Ticket className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* IN PROGRESS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-500">
                      In Progress
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : inProgressTickets}
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

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : overdueTickets}
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                MY ASSIGNED TICKETS
            ================================================= */}

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* SECTION HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

                <div>

                  <h2 className="font-semibold text-slate-900">
                    My Assigned Tickets
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Tickets currently assigned to you
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/staff/tickets")
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </button>

              </div>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <div className="space-y-3 p-6">

                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-xl bg-slate-50 p-4"
                    >
                      <div className="h-4 w-1/4 rounded bg-slate-200" />

                      <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
                    </div>
                  ))}

                </div>
              ) : recentTickets.length === 0 ? (

                /* =================================================
                    EMPTY
                ================================================= */

                <div className="px-6 py-16 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Ticket className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No assigned tickets
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Tickets assigned to you will appear here.
                  </p>

                </div>

              ) : (

                <>
                  {/* =================================================
                      DESKTOP TABLE
                  ================================================= */}

                  <div className="hidden overflow-x-auto md:block">

                    <table className="w-full min-w-[850px]">

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

                        {recentTickets.map((ticket) => (

                          <tr
                            key={ticket.id}
                            onClick={() =>
                              router.push(
                                `/staff/tickets/${ticket.id}`
                              )
                            }
                            className="cursor-pointer transition hover:bg-slate-50"
                          >

                            {/* TICKET NUMBER */}
                            <td className="px-6 py-4">

                              <span className="text-xs font-semibold text-blue-600">
                                {ticket.ticket_number}
                              </span>

                            </td>

                            {/* SUBJECT */}
                            <td className="max-w-[260px] px-6 py-4">

                              <p className="truncate text-sm font-semibold text-slate-900">
                                {ticket.subject}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatDate(ticket.created_at)}
                              </p>

                            </td>

                            {/* CATEGORY */}
                            <td className="px-6 py-4">

                              <span className="text-sm text-slate-600">
                                {ticket.category_name || "—"}
                              </span>

                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-4">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                                  ticket.status
                                )}`}
                              >
                                {formatStatus(ticket.status)}
                              </span>

                            </td>

                            {/* PRIORITY */}
                            <td className="px-6 py-4">

                              <span
                                className={`text-xs font-bold ${getPriorityStyle(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </span>

                            </td>

                            {/* SLA */}
                            <td className="px-6 py-4">

                              <span
                                className={`text-xs font-semibold ${getSlaStyle(
                                  ticket.slaStatus?.status
                                )}`}
                              >
                                {ticket.slaStatus?.status
                                  ? formatStatus(
                                      ticket.slaStatus.status
                                    )
                                  : "—"}
                              </span>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                  {/* =================================================
                      MOBILE TICKET CARDS
                  ================================================= */}

                  <div className="divide-y divide-slate-100 md:hidden">

                    {recentTickets.map((ticket) => (

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
                              {ticket.ticket_number}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(
                                ticket.status
                              )}`}
                            >
                              {formatStatus(ticket.status)}
                            </span>

                          </div>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {ticket.subject}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">

                            <span className="text-slate-500">
                              {ticket.category_name ||
                                "No category"}
                            </span>

                            <span
                              className={`font-semibold ${getPriorityStyle(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>

                            <span
                              className={`font-semibold ${getSlaStyle(
                                ticket.slaStatus?.status
                              )}`}
                            >
                              {ticket.slaStatus?.status
                                ? formatStatus(
                                    ticket.slaStatus.status
                                  )
                                : "—"}
                            </span>

                          </div>

                        </div>

                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />

                      </button>

                    ))}

                  </div>
                </>

              )}

            </section>

          </div>

        </main>

      </div>
    </div>
  );
}