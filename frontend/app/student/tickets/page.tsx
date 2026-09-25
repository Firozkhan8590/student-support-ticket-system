"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import type { Ticket as TicketType } from "@/types/ticket";

type StatusFilter = "ALL" | TicketType["status"];
type PriorityFilter = "ALL" | TicketType["priority"];

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("ALL");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/");
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

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        ticket.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [tickets, search, statusFilter, priorityFilter]);

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

  const formatStatus = (status: string) =>
    status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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
              onClick={() =>
                router.push("/student/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => setMobileMenu(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() =>
                router.push("/student/tickets/create")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-5 w-5" />
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
              onClick={() =>
                router.push("/student/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/student/tickets")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() =>
                router.push("/student/tickets/create")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-5 w-5" />
              Create Ticket
            </button>

          </nav>

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

            {/* PAGE HEADER */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <button
                  onClick={() =>
                    router.push("/student/dashboard")
                  }
                  className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </button>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  My Tickets
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View and track all your support requests.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push("/student/tickets/create")
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>

            </div>

            {/* FILTER CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex flex-col gap-3 lg:flex-row">

                {/* SEARCH */}
                <div className="relative flex-1">

                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search by ticket number or subject..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

                <button
                  onClick={() =>
                    setShowFilters(!showFilters)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>

                {/* DESKTOP FILTERS */}
                <div className="hidden gap-3 lg:flex">

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as StatusFilter
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All statuses
                    </option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">
                      Assigned
                    </option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="PENDING_STUDENT">
                      Pending
                    </option>
                    <option value="RESOLVED">
                      Resolved
                    </option>
                    <option value="CLOSED">Closed</option>
                    <option value="REOPENED">
                      Reopened
                    </option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(
                        e.target.value as PriorityFilter
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All priorities
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="LOW">Low</option>
                  </select>

                </div>

              </div>

              {/* MOBILE FILTERS */}
              {showFilters && (
                <div className="mt-3 grid gap-3 border-t pt-3 lg:hidden">

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as StatusFilter
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none"
                  >
                    <option value="ALL">
                      All statuses
                    </option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">
                      Assigned
                    </option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="PENDING_STUDENT">
                      Pending
                    </option>
                    <option value="RESOLVED">
                      Resolved
                    </option>
                    <option value="CLOSED">Closed</option>
                    <option value="REOPENED">
                      Reopened
                    </option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(
                        e.target.value as PriorityFilter
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none"
                  >
                    <option value="ALL">
                      All priorities
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="LOW">Low</option>
                  </select>

                </div>
              )}

            </div>

            {/* RESULT COUNT */}
            <div className="mt-6 flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredTickets.length}
                </span>{" "}
                {filteredTickets.length === 1
                  ? "ticket"
                  : "tickets"}
              </p>

              {(search ||
                statusFilter !== "ALL" ||
                priorityFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setPriorityFilter("ALL");
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}

            </div>

            {/* TICKETS */}
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {loading ? (
                <div className="divide-y">

                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse p-5"
                    >
                      <div className="h-4 w-1/4 rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
                    </div>
                  ))}

                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-6 py-16 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    {search ||
                    statusFilter !== "ALL" ||
                    priorityFilter !== "ALL" ? (
                      <Search className="h-7 w-7" />
                    ) : (
                      <Ticket className="h-7 w-7" />
                    )}
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900">
                    {search ||
                    statusFilter !== "ALL" ||
                    priorityFilter !== "ALL"
                      ? "No matching tickets"
                      : "No tickets yet"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    {search ||
                    statusFilter !== "ALL" ||
                    priorityFilter !== "ALL"
                      ? "Try changing your search or filters."
                      : "Create a support request and it will appear here."}
                  </p>

                  {!search &&
                    statusFilter === "ALL" &&
                    priorityFilter === "ALL" && (
                      <button
                        onClick={() =>
                          router.push(
                            "/student/tickets/create"
                          )
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Create Ticket
                      </button>
                    )}

                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() =>
                        router.push(
                          `/student/tickets/${ticket.id}`
                        )
                      }
                      className="group flex w-full items-start gap-4 p-5 text-left transition hover:bg-slate-50"
                    >

                      {/* ICON */}
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                        <Ticket className="h-5 w-5" />
                      </div>

                      {/* CONTENT */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="text-xs font-bold text-blue-600">
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

                        <h3 className="mt-2 truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 sm:text-base">
                          {ticket.subject}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">
                          {ticket.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">

                          <span className="text-xs text-slate-400">
                            Created {formatDate(ticket.created_at)}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${getPriorityStyle(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>

                        </div>

                      </div>

                      {/* ARROW */}
                      <div className="hidden items-center self-center text-slate-300 transition group-hover:text-blue-500 sm:flex">
                        <ArrowRight className="h-5 w-5" />
                      </div>

                    </button>
                  ))}

                </div>
              )}

            </div>

            {/* INFO */}
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Need help with something new?
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Create a new support ticket and the college
                  support team will review your request.
                </p>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}