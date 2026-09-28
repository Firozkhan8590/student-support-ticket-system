"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Ticket,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  getAllTickets,
  TicketListItem,
  TicketPriority,
  TicketStatus,
  GetAllTicketsParams,
} from "@/lib/ticket";
import { getCategories, TicketCategory } from "@/lib/category";
import { getAllStaff, Staff } from "@/lib/staff";

/* =========================================================
   HELPERS
========================================================= */

const statusOptions: TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_STUDENT",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
];

const priorityOptions: TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const formatStatus = (status?: string | null) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string | null) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   STATUS STYLES
========================================================= */

const getStatusClasses = (status?: TicketStatus | null) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "ASSIGNED":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "PENDING_STUDENT":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-slate-600/20";

    case "REOPENED":
      return "bg-pink-50 text-pink-700 ring-pink-600/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-600/20";
  }
};

/* =========================================================
   PRIORITY STYLES
========================================================= */

const getPriorityClasses = (priority?: TicketPriority | null) => {
  switch (priority) {
    case "LOW":
      return "bg-slate-100 text-slate-700";

    case "MEDIUM":
      return "bg-blue-50 text-blue-700";

    case "HIGH":
      return "bg-orange-50 text-orange-700";

    case "URGENT":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

/* =========================================================
   SLA
========================================================= */

const getSlaInfo = (ticket: TicketListItem) => {
  if (ticket.first_response_breached || ticket.resolution_breached) {
    return {
      label: "Breached",
      className: "text-red-600",
      icon: AlertCircle,
    };
  }

  if (ticket.resolved_at) {
    return {
      label: "Resolved",
      className: "text-emerald-600",
      icon: CheckCircle2,
    };
  }

  const status = ticket.slaStatus?.status;

  switch (status) {
    case "ON_TRACK":
      return {
        label: "On Track",
        className: "text-emerald-600",
        icon: CheckCircle2,
      };

    case "AT_RISK":
      return {
        label: "At Risk",
        className: "text-amber-600",
        icon: Clock,
      };

    case "BREACHED":
      return {
        label: "Breached",
        className: "text-red-600",
        icon: AlertCircle,
      };

    case "COMPLETED":
      return {
        label: "Completed",
        className: "text-emerald-600",
        icon: CheckCircle2,
      };

    default:
      return {
        label: "No SLA",
        className: "text-slate-400",
        icon: Clock,
      };
  }
};

/* =========================================================
   PAGE
========================================================= */

export default function ManagerTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  /* -------------------------
     DATA
  ------------------------- */

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  /* -------------------------
     UI
  ------------------------- */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* -------------------------
     FILTERS
  ------------------------- */

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [slaStatus, setSlaStatus] = useState("");

  /* -------------------------
     SORTING
  ------------------------- */

  const [sortBy, setSortBy] =
    useState<GetAllTicketsParams["sortBy"]>("created_at");

  const [sortOrder, setSortOrder] =
    useState<GetAllTicketsParams["sortOrder"]>("desc");

  /* -------------------------
     PAGINATION
  ------------------------- */

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /* =========================================================
     AUTH CHECK
  ========================================================= */

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
  }, [user, authLoading, router]);

  /* =========================================================
     FETCH CATEGORIES + STAFF
  ========================================================= */

  const fetchFilterData = useCallback(async () => {
    try {
      const [categoryData, staffData] = await Promise.all([
        getCategories(),
        getAllStaff(),
      ]);

      setCategories(categoryData);
      setStaff(staffData);
    } catch (err) {
      console.error("Failed to load filter data:", err);
    }
  }, []);

  /* =========================================================
     FETCH TICKETS
  ========================================================= */

  const fetchTickets = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params: GetAllTicketsParams = {
          page,
          limit,
          sortBy,
          sortOrder,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (status) {
          params.status = status;
        }

        if (priority) {
          params.priority = priority;
        }

        if (categoryId) {
          params.categoryId = Number(categoryId);
        }

        if (assignedTo) {
          params.assignedTo = Number(assignedTo);
        }

        if (slaStatus) {
          params.slaStatus = slaStatus;
        }

        const result = await getAllTickets(params);

        setTickets(result.tickets || []);

        setPagination(
          result.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (err: any) {
        console.error("Failed to fetch tickets:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load tickets."
        );

        setTickets([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      limit,
      search,
      status,
      priority,
      categoryId,
      assignedTo,
      slaStatus,
      sortBy,
      sortOrder,
    ]
  );

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {
    if (authLoading || !user || user.role !== "MANAGER") {
      return;
    }

    fetchFilterData();
  }, [authLoading, user, fetchFilterData]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "MANAGER") {
      return;
    }

    fetchTickets();
  }, [authLoading, user, fetchTickets]);

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setStatus(event.target.value as TicketStatus | "");
    setPage(1);
  };

  const handlePriorityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPriority(event.target.value as TicketPriority | "");
    setPage(1);
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategoryId(event.target.value);
    setPage(1);
  };

  const handleAssignedToChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAssignedTo(event.target.value);
    setPage(1);
  };

  const handleSlaChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSlaStatus(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategoryId("");
    setAssignedTo("");
    setSlaStatus("");
    setPage(1);
  };

  const hasFilters = Boolean(
    search ||
      status ||
      priority ||
      categoryId ||
      assignedTo ||
      slaStatus
  );

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    router.replace("/");
  };

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total = pagination.total;

    const open = tickets.filter(
      (ticket) =>
        ticket.status === "OPEN" ||
        ticket.status === "REOPENED"
    ).length;

    const inProgress = tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS"
    ).length;

    const resolved = tickets.filter(
      (ticket) =>
        ticket.status === "RESOLVED" ||
        ticket.status === "CLOSED"
    ).length;

    return {
      total,
      open,
      inProgress,
      resolved,
    };
  }, [tickets, pagination.total]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const startItem =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  const goToPage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    setPage(nextPage);
  };

  /* =========================================================
     LOADING AUTH
  ========================================================= */

  if (
    authLoading ||
    !user ||
    user.role !== "MANAGER"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Student Support
              </p>

              <p className="text-[11px] text-slate-500">
                Manager Portal
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
          {user.name?.charAt(0)?.toUpperCase() || "M"}
        </div>
      </header>

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />

          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-xl">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    Student Support
                  </p>

                  <p className="text-xs text-slate-500">
                    Manager Portal
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ManagerSidebarNav
              currentPath="/manager/tickets"
              onNavigate={() => setMobileMenuOpen(false)}
            />

            <div className="shrink-0 border-t border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {user.name?.charAt(0)?.toUpperCase() || "M"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    Manager
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          DESKTOP LAYOUT
      ===================================================== */}

      <div className="flex min-h-screen">
        {/* ===================================================
            DESKTOP SIDEBAR
        =================================================== */}

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
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

          <ManagerSidebarNav currentPath="/manager/tickets" />

          <div className="shrink-0 border-t border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                {user.name?.charAt(0)?.toUpperCase() || "M"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  Manager
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <button
                  onClick={() =>
                    router.push("/manager/dashboard")
                  }
                  className="flex items-center gap-1 transition hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </button>

                <span>/</span>

                <span className="font-medium text-slate-700">
                  Tickets
                </span>
              </div>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Tickets
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage and monitor all student support tickets.
                  </p>
                </div>

                <button
                  onClick={() => fetchTickets(true)}
                  disabled={refreshing}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />

                  Refresh
                </button>
              </div>
            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Tickets"
                value={stats.total}
                icon={Ticket}
                iconClass="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Open"
                value={stats.open}
                icon={AlertCircle}
                iconClass="bg-orange-50 text-orange-600"
              />

              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={Clock}
                iconClass="bg-amber-50 text-amber-600"
              />

              <StatCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* =================================================
                SEARCH + FILTER
            ================================================= */}

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search ticket number, subject, student name or email..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  onClick={() =>
                    setFiltersOpen((value) => !value)
                  }
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                    filtersOpen || hasFilters
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="h-4 w-4" />

                  Filters

                  {hasFilters ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                      {
                        [
                          status,
                          priority,
                          categoryId,
                          assignedTo,
                          slaStatus,
                        ].filter(Boolean).length
                      }
                    </span>
                  ) : null}

                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      filtersOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* FILTERS */}

              {filtersOpen && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <FilterSelect
                      label="Status"
                      value={status}
                      onChange={handleStatusChange}
                    >
                      <option value="">All statuses</option>

                      {statusOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatStatus(item)}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      label="Priority"
                      value={priority}
                      onChange={handlePriorityChange}
                    >
                      <option value="">All priorities</option>

                      {priorityOptions.map((item) => (
                        <option key={item} value={item}>
                          {formatStatus(item)}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      label="Category"
                      value={categoryId}
                      onChange={handleCategoryChange}
                    >
                      <option value="">All categories</option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      label="Assigned To"
                      value={assignedTo}
                      onChange={handleAssignedToChange}
                    >
                      <option value="">All staff</option>

                      {staff.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      label="SLA"
                      value={slaStatus}
                      onChange={handleSlaChange}
                    >
                      <option value="">All SLA</option>

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
                    </FilterSelect>
                  </div>

                  {hasFilters && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                RESULTS HEADER
            ================================================= */}

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {loading
                    ? "Loading tickets..."
                    : `${startItem}-${endItem} of ${pagination.total} tickets`}
                </p>

                {!loading && hasFilters ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Filtered results
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Sort:
                </label>

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(
                      event.target.value as GetAllTicketsParams["sortBy"]
                    );
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="created_at">
                    Created
                  </option>

                  <option value="updated_at">
                    Updated
                  </option>

                  <option value="priority">
                    Priority
                  </option>

                  <option value="status">
                    Status
                  </option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder((current) =>
                      current === "asc" ? "desc" : "asc"
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  title={
                    sortOrder === "asc"
                      ? "Ascending"
                      : "Descending"
                  }
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-start">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Unable to load tickets
                  </p>

                  <p className="mt-1 break-words text-red-600">
                    {error}
                  </p>
                </div>

                <button
                  onClick={() => fetchTickets(true)}
                  className="shrink-0 self-start rounded-lg px-3 py-1.5 font-semibold transition hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            )}

            {/* =================================================
                TICKET TABLE / CARDS
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <TicketTableSkeleton />
              ) : tickets.length === 0 ? (
                <EmptyTickets
                  hasFilters={Boolean(hasFilters)}
                  onClear={clearFilters}
                />
              ) : (
                <>
                  {/* =================================================
                      DESKTOP TABLE
                      xl and above
                  ================================================= */}

                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full min-w-[1000px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="w-[250px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Ticket
                          </th>

                          <th className="w-[210px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Student
                          </th>

                          <th className="w-[150px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Category
                          </th>

                          <th className="w-[120px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Priority
                          </th>

                          <th className="w-[145px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="w-[150px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Assigned
                          </th>

                          <th className="w-[120px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            SLA
                          </th>

                          <th className="w-[125px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {tickets.map((ticket) => (
                          <TicketTableRow
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() =>
                              router.push(
                                `/manager/tickets/${ticket.id}`
                              )
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* =================================================
                      MOBILE + TABLET CARDS
                  ================================================= */}

                  <div className="divide-y divide-slate-100 xl:hidden">
                    {tickets.map((ticket) => (
                      <TicketMobileCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() =>
                          router.push(
                            `/manager/tickets/${ticket.id}`
                          )
                        }
                      />
                    ))}
                  </div>

                  {/* =================================================
                      PAGINATION
                  ================================================= */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {startItem}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-700">
                        {endItem}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700">
                        {pagination.total}
                      </span>
                    </p>

                    <div className="flex min-w-0 items-center gap-1">
                      <button
                        onClick={() =>
                          goToPage(pagination.page - 1)
                        }
                        disabled={pagination.page <= 1}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {/* Mobile: only current page */}

                      <div className="flex items-center sm:hidden">
                        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white">
                          {pagination.page}
                        </span>
                      </div>

                      {/* Desktop: full pagination */}

                      <div className="hidden items-center gap-1 sm:flex">
                        {getPageNumbers(
                          pagination.page,
                          pagination.totalPages
                        ).map((item, index) =>
                          item === "..." ? (
                            <span
                              key={`dots-${index}`}
                              className="px-2 text-xs text-slate-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => goToPage(item)}
                              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                                pagination.page === item
                                  ? "bg-blue-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={() =>
                          goToPage(pagination.page + 1)
                        }
                        disabled={
                          pagination.page >=
                          pagination.totalPages
                        }
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function ManagerSidebarNav({
  currentPath,
  onNavigate,
}: {
  currentPath?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  const items = [
    {
      label: "Dashboard",
      path: "/manager/dashboard",
      icon: Ticket,
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
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {items.map((item) => {
        const Icon = item.icon;

        const active = currentPath === item.path;

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
    </nav>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}

/* =========================================================
   DESKTOP TABLE ROW
========================================================= */

function TicketTableRow({
  ticket,
  onClick,
}: {
  ticket: TicketListItem;
  onClick: () => void;
}) {
  const sla = getSlaInfo(ticket);
  const SlaIcon = sla.icon;

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer transition hover:bg-blue-50/40"
    >
      {/* TICKET */}

      <td className="px-5 py-4 align-middle">
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-600 transition group-hover:text-blue-700">
              #{ticket.ticket_number}
            </span>
          </div>

          <p className="mt-1 max-w-[260px] truncate text-sm font-semibold text-slate-900">
            {ticket.subject}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Updated {formatDateTime(ticket.updated_at)}
          </p>
        </div>
      </td>

      {/* STUDENT */}

      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-[180px] items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {ticket.student_name
              ?.charAt(0)
              ?.toUpperCase() || "S"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {ticket.student_name || "Unknown"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {ticket.student_email || "-"}
            </p>
          </div>
        </div>
      </td>

      {/* CATEGORY */}

      <td className="px-5 py-4 align-middle">
        <span className="block max-w-[140px] truncate text-sm text-slate-600">
          {ticket.category_name || "-"}
        </span>
      </td>

      {/* PRIORITY */}

      <td className="px-5 py-4 align-middle">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClasses(
            ticket.priority
          )}`}
        >
          {formatStatus(ticket.priority)}
        </span>
      </td>

      {/* STATUS */}

      <td className="px-5 py-4 align-middle">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
            ticket.status
          )}`}
        >
          {formatStatus(ticket.status)}
        </span>
      </td>

      {/* ASSIGNED */}

      <td className="px-5 py-4 align-middle">
        {ticket.assigned_to_name ? (
          <div className="flex min-w-[130px] items-center gap-2">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-500" />

            <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
              {ticket.assigned_to_name}
            </span>
          </div>
        ) : (
          <span className="whitespace-nowrap text-sm font-medium text-slate-400">
            Unassigned
          </span>
        )}
      </td>

      {/* SLA */}

      <td className="px-5 py-4 align-middle">
        <div
          className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${sla.className}`}
        >
          <SlaIcon className="h-4 w-4 shrink-0" />
          {sla.label}
        </div>
      </td>

      {/* CREATED */}

      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 align-middle">
        {formatDate(ticket.created_at)}
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE / TABLET CARD
========================================================= */

function TicketMobileCard({
  ticket,
  onClick,
}: {
  ticket: TicketListItem;
  onClick: () => void;
}) {
  const sla = getSlaInfo(ticket);
  const SlaIcon = sla.icon;

  return (
    <button
      onClick={onClick}
      className="block w-full text-left transition hover:bg-slate-50 active:bg-slate-100"
    >
      <div className="p-4 sm:p-5">
        {/* TOP */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-blue-600">
              #{ticket.ticket_number}
            </p>

            <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">
              {ticket.subject}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusClasses(
              ticket.status
            )}`}
          >
            {formatStatus(ticket.status)}
          </span>
        </div>

        {/* DETAILS */}

        <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Student
            </p>

            <p className="mt-1 truncate text-sm font-medium text-slate-700">
              {ticket.student_name || "Unknown"}
            </p>

            {ticket.student_email && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {ticket.student_email}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Category
            </p>

            <p className="mt-1 truncate text-sm font-medium text-slate-700">
              {ticket.category_name || "-"}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Priority
            </p>

            <span
              className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${getPriorityClasses(
                ticket.priority
              )}`}
            >
              {formatStatus(ticket.priority)}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Assigned
            </p>

            <p className="mt-1 truncate text-sm font-medium text-slate-700">
              {ticket.assigned_to_name || "Unassigned"}
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${sla.className}`}
          >
            <SlaIcon className="h-3.5 w-3.5 shrink-0" />
            {sla.label}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyTickets({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Ticket className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        {hasFilters
          ? "No matching tickets"
          : "No tickets found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try changing or clearing your filters to see more tickets."
          : "There are currently no tickets available."}
      </p>

      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   RESPONSIVE TABLE SKELETON
========================================================= */

function TicketTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index}>
          {/* DESKTOP SKELETON */}

          <div className="hidden animate-pulse xl:grid xl:grid-cols-[1.7fr_1.4fr_1fr_0.8fr_1fr_1fr_0.8fr_0.8fr] xl:items-center xl:gap-4 xl:px-5 xl:py-5">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
            </div>

            <div className="h-4 w-24 rounded bg-slate-100" />

            <div className="h-6 w-20 rounded-full bg-slate-100" />

            <div className="h-6 w-24 rounded-full bg-slate-100" />

            <div className="h-4 w-24 rounded bg-slate-100" />

            <div className="h-4 w-20 rounded bg-slate-100" />

            <div className="h-4 w-20 rounded bg-slate-100" />
          </div>

          {/* MOBILE / TABLET SKELETON */}

          <div className="flex animate-pulse flex-col gap-4 px-4 py-5 xl:hidden sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
              </div>

              <div className="h-6 w-20 shrink-0 rounded-full bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-4 w-24 rounded bg-slate-100" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PAGINATION NUMBERS
========================================================= */

function getPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}