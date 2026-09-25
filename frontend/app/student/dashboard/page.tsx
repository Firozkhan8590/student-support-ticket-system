"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import type { Ticket as TicketType } from "@/types/ticket";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (user.role !== "STUDENT") {
      if (user.role === "STAFF") {
        router.push("/staff/dashboard");
      } else if (user.role === "MANAGER") {
        router.push("/manager/dashboard");
      }

      return;
    }

    fetchTickets();
  }, [user, authLoading, router]);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const response = await api.get("/tickets/my");

      const data = response.data.data;

      if (Array.isArray(data)) {
        setTickets(data);
      } else if (Array.isArray(data?.tickets)) {
        setTickets(data.tickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

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

  const openTickets = tickets.filter(
    (ticket) =>
      !["RESOLVED", "CLOSED"].includes(ticket.status)
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "RESOLVED" ||
      ticket.status === "CLOSED"
  ).length;

  const pendingTickets = tickets.filter(
    (ticket) => ticket.status === "PENDING_STUDENT"
  ).length;

  const urgentTickets = tickets.filter(
    (ticket) =>
      ticket.priority === "URGENT" ||
      ticket.priority === "HIGH"
  ).length;

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const getStatusStyle = (status: TicketType["status"]) => {
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

  const getPriorityStyle = (
    priority: TicketType["priority"]
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
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"
              onClick={() => {
                setMobileMenu(false);
                router.push("/student/dashboard");
              }}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setMobileMenu(false);
                router.push("/student/tickets");
              }}
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setMobileMenu(false);
                router.push("/student/tickets/create");
              }}
            >
              <Plus className="h-5 w-5" />
              Create Ticket
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              onClick={logout}
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

          {/* LOGO */}
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

          {/* NAVIGATION */}
          <nav className="flex-1 space-y-1 p-4">

            <button
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
              onClick={() =>
                router.push("/student/dashboard")
              }
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              onClick={() =>
                router.push("/student/tickets")
              }
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              onClick={() =>
                router.push("/student/tickets/create")
              }
            >
              <Plus className="h-5 w-5" />
              Create Ticket
            </button>

          </nav>

          {/* USER */}
          <div className="border-t p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.studentId || "Student"}
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

            {/* TOP */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <p className="text-sm font-medium text-blue-600">
                  Student Portal
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome back, {user.name.split(" ")[0]} 👋
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Here's an overview of your support requests.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push("/student/tickets/create")
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>

            </div>

            {/* STATS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Tickets
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : tickets.length}
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
                      Open Tickets
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : openTickets}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* PENDING */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Action Required
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : pendingTickets}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                </div>

              </div>

              {/* RESOLVED */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Resolved
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {loading ? "—" : resolvedTickets}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                </div>

              </div>

            </div>

            {/* CONTENT GRID */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">

              {/* RECENT TICKETS */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b px-5 py-5 sm:px-6">

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Recent Tickets
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Your latest support requests
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      router.push("/student/tickets")
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </button>

                </div>

                {loading ? (
                  <div className="space-y-4 p-6">

                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-xl bg-slate-50 p-4"
                      >
                        <div className="h-4 w-1/3 rounded bg-slate-200" />
                        <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
                      </div>
                    ))}

                  </div>
                ) : recentTickets.length === 0 ? (
                  <div className="px-6 py-14 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Ticket className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-900">
                      No tickets yet
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                      You haven't submitted any support requests yet.
                    </p>

                    <button
                      onClick={() =>
                        router.push(
                          "/student/tickets/create"
                        )
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first ticket
                    </button>

                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">

                    {recentTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() =>
                          router.push(
                            `/student/tickets/${ticket.id}`
                          )
                        }
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                      >

                        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
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

                          <p className="mt-1 truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                            {ticket.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Created {formatDate(ticket.created_at)}
                          </p>

                        </div>

                        <div className="hidden text-right sm:block">

                          <p
                            className={`text-xs font-semibold ${getPriorityStyle(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </p>

                          <ArrowRight className="ml-auto mt-2 h-4 w-4 text-slate-300 group-hover:text-blue-500" />

                        </div>

                      </button>
                    ))}

                  </div>
                )}

              </section>

              {/* QUICK ACTIONS */}
              <aside className="space-y-6">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <h2 className="font-semibold text-slate-900">
                    Quick Actions
                  </h2>

                  <div className="mt-4 space-y-2">

                    <button
                      onClick={() =>
                        router.push(
                          "/student/tickets/create"
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Plus className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Create Ticket
                        </p>

                        <p className="text-xs text-slate-500">
                          Raise a new request
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        router.push("/student/tickets")
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Ticket className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          My Tickets
                        </p>

                        <p className="text-xs text-slate-500">
                          View all requests
                        </p>
                      </div>
                    </button>

                  </div>

                </div>

                {/* SUMMARY */}
                <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">

                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Ticket Summary
                  </p>

                  <div className="mt-5 space-y-4">

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        High / Urgent
                      </span>

                      <span className="font-semibold">
                        {urgentTickets}
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Resolved
                      </span>

                      <span className="font-semibold text-green-400">
                        {resolvedTickets}
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Awaiting your action
                      </span>

                      <span className="font-semibold text-orange-400">
                        {pendingTickets}
                      </span>
                    </div>

                  </div>

                </div>

              </aside>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}