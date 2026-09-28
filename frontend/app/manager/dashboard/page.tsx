"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface TicketItem {
  id: number;
  ticket_number?: string;
  subject?: string;
  status?: string;
  priority?: string;
  category_name?: string | null;
  assigned_to_name?: string | null;
  created_at?: string;
}

interface StaffItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* -------------------------------------------------------
     LOAD DASHBOARD DATA
  ------------------------------------------------------- */

  useEffect(() => {
    if (!user || user.role !== "MANAGER") return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [ticketsResponse, staffResponse] =
          await Promise.all([
            api.get("/tickets"),
            api.get("/users/staff"),
          ]);

        const ticketData = ticketsResponse.data?.data;
        const staffData = staffResponse.data?.data;

        if (Array.isArray(ticketData)) {
          setTickets(ticketData);
        } else if (Array.isArray(ticketData?.tickets)) {
          setTickets(ticketData.tickets);
        } else {
          setTickets([]);
        }

        if (Array.isArray(staffData)) {
          setStaff(staffData);
        } else {
          setStaff([]);
        }
      } catch (err: any) {
        console.error("Manager dashboard error:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  /* -------------------------------------------------------
     DASHBOARD STATS
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = tickets.length;

    const open = tickets.filter(
      (ticket) =>
        ticket.status !== "RESOLVED" &&
        ticket.status !== "CLOSED"
    ).length;

    const resolved = tickets.filter(
      (ticket) =>
        ticket.status === "RESOLVED" ||
        ticket.status === "CLOSED"
    ).length;

    const pending = tickets.filter(
      (ticket) => ticket.status === "PENDING_STUDENT"
    ).length;

    const highPriority = tickets.filter(
      (ticket) =>
        ticket.priority === "HIGH" ||
        ticket.priority === "URGENT"
    ).length;

    const activeStaff = staff.filter(
      (member) => member.is_active
    ).length;

    return {
      total,
      open,
      resolved,
      pending,
      highPriority,
      activeStaff,
    };
  }, [tickets, staff]);

  /* -------------------------------------------------------
     HELPERS
  ------------------------------------------------------- */

  const formatStatus = (status?: string | null) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatPriority = (priority?: string | null) => {
    if (!priority) return "Normal";

    return priority
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-50 text-emerald-700";

      case "PENDING_STUDENT":
        return "bg-amber-50 text-amber-700";

      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700";

      case "ASSIGNED":
        return "bg-violet-50 text-violet-700";

      case "REOPENED":
        return "bg-orange-50 text-orange-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-50 text-red-700";

      case "HIGH":
        return "bg-orange-50 text-orange-700";

      case "MEDIUM":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const recentTickets = tickets.slice(0, 6);

  const navigate = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ===================================================
          DESKTOP + MAIN WRAPPER
      =================================================== */}

      <div className="flex min-h-screen">

        {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}

        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">

          {/* BRAND */}
          <div className="flex h-[76px] shrink-0 items-center border-b border-slate-100 px-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="text-[15px] font-bold text-slate-900">
                  Student Support
                </h1>

                <p className="text-[11px] text-slate-400">
                  College Helpdesk Portal
                </p>
              </div>

            </div>

          </div>

          {/* NAVIGATION */}
          <div className="flex-1 px-3 py-6">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Management
            </p>

            <nav className="space-y-1">

              {/* DASHBOARD */}
              <button
                type="button"
                onClick={() =>
                  navigate("/manager/dashboard")
                }
                className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700"
              >
                <LayoutDashboard className="h-[18px] w-[18px]" />

                <span>Dashboard</span>
              </button>

              {/* STAFF */}
              <button
                type="button"
                onClick={() =>
                  navigate("/manager/staff")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Users className="h-[18px] w-[18px]" />

                <span>Staff Management</span>
              </button>

              {/* TICKETS */}
              <button
                type="button"
                onClick={() =>
                  navigate("/manager/tickets")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Ticket className="h-[18px] w-[18px]" />

                <span>All Tickets</span>
              </button>

              {/* PROFILE */}
              <button
                type="button"
                onClick={() =>
                  navigate("/manager/profile")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <UserCog className="h-[18px] w-[18px]" />

                <span>Profile</span>
              </button>

            </nav>
          </div>

          {/* USER SECTION */}
          <div className="shrink-0 border-t border-slate-100 p-4">

            <div className="mb-3 flex items-center gap-3 px-2">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "M"}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name || "Manager"}
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {user?.email || ""}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-[18px] w-[18px]" />

              <span>Logout</span>
            </button>

          </div>

        </aside>

        {/* =================================================
            MOBILE SIDEBAR
        ================================================= */}

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50
            flex w-[250px] flex-col
            border-r border-slate-200
            bg-white
            shadow-xl
            transition-transform duration-300
            lg:hidden
            ${
              mobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >

          {/* MOBILE BRAND */}
          <div className="flex h-[76px] shrink-0 items-center border-b border-slate-100 px-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-[15px] font-bold text-slate-900">
                  Student Support
                </h1>

                <p className="text-[11px] text-slate-400">
                  College Helpdesk Portal
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

          </div>

          {/* MOBILE NAV */}
          <div className="flex-1 px-3 py-6">

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Management
            </p>

            <nav className="space-y-1">

              <button
                type="button"
                onClick={() =>
                  navigate("/manager/dashboard")
                }
                className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700"
              >
                <LayoutDashboard className="h-[18px] w-[18px]" />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/manager/staff")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Users className="h-[18px] w-[18px]" />
                Staff Management
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/manager/tickets")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Ticket className="h-[18px] w-[18px]" />
                All Tickets
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/manager/profile")
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <UserCog className="h-[18px] w-[18px]" />
                Profile
              </button>

            </nav>

          </div>

          {/* MOBILE USER */}
          <div className="shrink-0 border-t border-slate-100 p-4">

            <div className="mb-3 flex items-center gap-3 px-2">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "M"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name || "Manager"}
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {user?.email || ""}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>

          </div>

        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="min-w-0 flex-1">

          {/* TOP BAR */}
          <header className="hidden h-[76px] items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">

            <div>
              <p className="text-xs text-slate-400">
                Management
              </p>

              <h2 className="mt-0.5 text-base font-semibold text-slate-800">
                Manager Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name || "Manager"}
                </p>

                <p className="text-[11px] text-slate-400">
                  Manager
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "M"}
              </div>

            </div>

          </header>

          {/* MOBILE TOP BAR */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <span className="text-sm font-bold text-slate-900">
                Student Support
              </span>

            </div>

            <div className="h-9 w-9" />

          </header>

          {/* PAGE CONTENT */}
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">

            {/* PAGE HEADER */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Overview
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back,{" "}
                  {user?.name?.split(" ")[0] ||
                    "Manager"}
                </h1>

                <p className="mt-1.5 text-sm text-slate-500">
                  Monitor your campus support activity
                  and manage your team.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/manager/tickets")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                View All Tickets
                <ArrowUpRight className="h-4 w-4" />
              </button>

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* =================================================
                MAIN STAT CARDS
            ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      Total Tickets
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.total}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Ticket className="h-5 w-5" />
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  All support requests
                </p>

              </div>

              {/* OPEN */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      Open Tickets
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.open}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Requiring attention
                </p>

              </div>

              {/* RESOLVED */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      Resolved
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.resolved}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Resolved or closed
                </p>

              </div>

              {/* ACTIVE STAFF */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      Active Staff
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.activeStaff}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Users className="h-5 w-5" />
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Currently active
                </p>

              </div>

            </div>

            {/* =================================================
                SECONDARY METRICS
            ================================================= */}

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              {/* HIGH PRIORITY */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      High Priority
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.highPriority}
                    </p>
                  </div>

                </div>

                <span className="text-xs text-slate-400">
                  Need attention
                </span>

              </div>

              {/* PENDING */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Activity className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Pending Student
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {loading
                        ? "—"
                        : stats.pending}
                    </p>
                  </div>

                </div>

                <span className="text-xs text-slate-400">
                  Waiting for response
                </span>

              </div>

            </div>

            {/* =================================================
                RECENT TICKETS
            ================================================= */}

            <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recent Tickets
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Latest support requests
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/manager/tickets")
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>

              </div>

              {/* LOADING */}
              {loading ? (
                <div className="space-y-3 p-5">

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-14 animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}

                </div>

              ) : recentTickets.length === 0 ? (

                /* EMPTY */
                <div className="px-6 py-14 text-center">

                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Ticket className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No tickets yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New support requests will appear
                    here.
                  </p>

                </div>

              ) : (

                /* TABLE */
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[760px]">

                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Ticket
                        </th>

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Subject
                        </th>

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Priority
                        </th>

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Assigned
                        </th>

                        <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Created
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {recentTickets.map((ticket) => (

                        <tr
                          key={ticket.id}
                          onClick={() =>
                            navigate(
                              `/manager/tickets/${ticket.id}`
                            )
                          }
                          className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-6 py-4">

                            <span className="text-xs font-semibold text-blue-600">
                              {ticket.ticket_number ||
                                `#${ticket.id}`}
                            </span>

                          </td>

                          <td className="max-w-[260px] px-6 py-4">

                            <p className="truncate text-sm font-medium text-slate-800">
                              {ticket.subject ||
                                "Untitled ticket"}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {ticket.category_name ||
                                "No category"}
                            </p>

                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                                ticket.status
                              )}`}
                            >
                              {formatStatus(
                                ticket.status
                              )}
                            </span>

                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityClass(
                                ticket.priority
                              )}`}
                            >
                              {formatPriority(
                                ticket.priority
                              )}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            {ticket.assigned_to_name ||
                              "Unassigned"}
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-400">
                            {formatDate(
                              ticket.created_at
                            )}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="mt-7 pb-8">

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-slate-900">
                  Quick Actions
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Common management tasks
                </p>

              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* STAFF */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/manager/staff")
                  }
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Staff Management
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Create and manage staff accounts
                      </p>
                    </div>

                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />

                </button>

                {/* TICKETS */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/manager/tickets")
                  }
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Ticket className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Ticket Management
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Review and manage all tickets
                      </p>
                    </div>

                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500" />

                </button>

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}