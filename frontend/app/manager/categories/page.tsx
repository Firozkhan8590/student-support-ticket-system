"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  Filter,
  GraduationCap,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  getCategories,
  updateCategoryStatus,
  TicketCategory,
  CategoryPriority,
} from "@/lib/category";
import CategoryModal from "./components/addcategorymodal";



/* =========================================================
   HELPERS
========================================================= */

const formatPriority = (priority?: string | null) => {
  if (!priority) return "Unknown";

  return priority
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

const getPriorityClasses = (
  priority?: CategoryPriority | null
) => {
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
   PAGE
========================================================= */

export default function ManagerCategoriesPage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  /* -------------------------
     DATA
  ------------------------- */

  const [categories, setCategories] =
    useState<TicketCategory[]>([]);

  /* -------------------------
     UI
  ------------------------- */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* -------------------------
     SEARCH
  ------------------------- */

  const [search, setSearch] = useState("");

  /* -------------------------
     CATEGORY MODAL
  ------------------------- */

  const [modalOpen, setModalOpen] = useState(false);

  const [modalMode, setModalMode] =
    useState<"create" | "edit">("create");

  const [selectedCategory, setSelectedCategory] =
    useState<TicketCategory | null>(null);

  /* -------------------------
     STATUS
  ------------------------- */

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<number | null>(null);

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
     FETCH CATEGORIES
  ========================================================= */

  const fetchCategories = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const result = await getCategories();

        setCategories(result || []);
      } catch (err: any) {
        console.error(
          "Failed to fetch categories:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load categories."
        );

        setCategories([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL DATA
  ========================================================= */

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      user.role !== "MANAGER"
    ) {
      return;
    }

    fetchCategories();
  }, [
    authLoading,
    user,
    fetchCategories,
  ]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name
          .toLowerCase()
          .includes(query) ||
        category.description
          ?.toLowerCase()
          .includes(query) ||
        category.default_priority
          .toLowerCase()
          .includes(query)
      );
    });
  }, [categories, search]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total = categories.length;

    const active = categories.filter(
      (category) => category.is_active
    ).length;

    const inactive = categories.filter(
      (category) => !category.is_active
    ).length;

    const averageSla =
      total > 0
        ? Math.round(
            categories.reduce(
              (sum, category) =>
                sum +
                Number(category.sla_hours || 0),
              0
            ) / total
          )
        : 0;

    return {
      total,
      active,
      inactive,
      averageSla,
    };
  }, [categories]);

  /* =========================================================
     CREATE
  ========================================================= */

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedCategory(null);
    setError("");
    setModalOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = (
    category: TicketCategory
  ) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setError("");
    setModalOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  /* =========================================================
     MODAL SUCCESS
  ========================================================= */

  const handleModalSuccess = async () => {
    closeModal();
    await fetchCategories();
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const handleStatusToggle = async (
    category: TicketCategory
  ) => {
    try {
      setStatusUpdatingId(category.id);
      setError("");

      await updateCategoryStatus(
        category.id,
        !category.is_active
      );

      await fetchCategories();
    } catch (err: any) {
      console.error(
        "Failed to update category status:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update category status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* =========================================================
     AUTH LOADING
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
            onClick={() =>
              setMobileMenuOpen(true)
            }
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
          {user.name
            ?.charAt(0)
            ?.toUpperCase() || "M"}
        </div>

      </header>

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            aria-label="Close menu"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="absolute inset-0 bg-slate-900/40"
          />

          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-xl">

            {/* BRAND */}

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
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* NAV */}

            <ManagerSidebarNav
              currentPath="/manager/categories"
              onNavigate={() =>
                setMobileMenuOpen(false)
              }
            />

            {/* USER */}

            <ManagerUser user={user} />

          </aside>
        </div>
      )}

      {/* =====================================================
          DESKTOP LAYOUT
      ===================================================== */}

      <div className="flex min-h-screen">

        {/* DESKTOP SIDEBAR */}

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">

          {/* BRAND */}

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

          {/* NAV */}

          <ManagerSidebarNav
            currentPath="/manager/categories"
          />

          {/* USER */}

          <ManagerUser user={user} />

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="min-w-0 flex-1">

          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

            {/* HEADER */}

            <div className="mb-7">

              {/* BREADCRUMB */}

              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">

                <button
                  onClick={() =>
                    router.push(
                      "/manager/dashboard"
                    )
                  }
                  className="flex items-center gap-1 transition hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </button>

                <span>/</span>

                <span className="font-medium text-slate-700">
                  Categories
                </span>

              </div>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div className="min-w-0">

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Categories
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage ticket categories,
                    priorities, and SLA settings.
                  </p>

                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() =>
                      fetchCategories(true)
                    }
                    disabled={refreshing}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

                  <button
                    onClick={openCreateModal}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </button>

                </div>

              </div>

            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Categories"
                value={stats.total}
                icon={Filter}
                iconClass="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Active"
                value={stats.active}
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Inactive"
                value={stats.inactive}
                icon={XCircle}
                iconClass="bg-slate-100 text-slate-600"
              />

              <StatCard
                title="Average SLA"
                value={`${stats.averageSla}h`}
                icon={Clock}
                iconClass="bg-amber-50 text-amber-600"
              />

            </div>

            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">

              <div className="relative min-w-0">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search category name, description or priority..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* RESULTS HEADER */}

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold text-slate-900">

                  {loading
                    ? "Loading categories..."
                    : `${filteredCategories.length} ${
                        filteredCategories.length ===
                        1
                          ? "category"
                          : "categories"
                      }`}

                </p>

                {!loading && search ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Search results
                  </p>
                ) : null}

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-start">

                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="min-w-0 flex-1">

                  <p className="font-semibold">
                    Unable to load categories
                  </p>

                  <p className="mt-1 break-words text-red-600">
                    {error}
                  </p>

                </div>

                <button
                  onClick={() =>
                    fetchCategories(true)
                  }
                  className="shrink-0 self-start rounded-lg px-3 py-1.5 font-semibold transition hover:bg-red-100"
                >
                  Retry
                </button>

              </div>
            )}

            {/* =================================================
                CATEGORY TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {loading ? (
                <CategoryTableSkeleton />
              ) : filteredCategories.length === 0 ? (
                <EmptyCategories
                  hasSearch={Boolean(search)}
                  onClear={() =>
                    setSearch("")
                  }
                  onCreate={openCreateModal}
                />
              ) : (
                <>

                  {/* DESKTOP */}

                  <div className="hidden overflow-x-auto xl:block">

                    <table className="w-full min-w-[950px] border-collapse">

                      <thead>

                        <tr className="border-b border-slate-200 bg-slate-50">

                          <th className="w-[260px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Category
                          </th>

                          <th className="w-[260px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Description
                          </th>

                          <th className="w-[150px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Priority
                          </th>

                          <th className="w-[120px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            SLA
                          </th>

                          <th className="w-[130px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="w-[190px] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Actions
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {filteredCategories.map(
                          (category) => (
                            <CategoryTableRow
                              key={category.id}
                              category={category}
                              onEdit={() =>
                                openEditModal(
                                  category
                                )
                              }
                              onStatus={() =>
                                handleStatusToggle(
                                  category
                                )
                              }
                              statusUpdating={
                                statusUpdatingId ===
                                category.id
                              }
                            />
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* MOBILE / TABLET */}

                  <div className="divide-y divide-slate-100 xl:hidden">

                    {filteredCategories.map(
                      (category) => (
                        <CategoryMobileCard
                          key={category.id}
                          category={category}
                          onEdit={() =>
                            openEditModal(
                              category
                            )
                          }
                          onStatus={() =>
                            handleStatusToggle(
                              category
                            )
                          }
                          statusUpdating={
                            statusUpdatingId ===
                            category.id
                          }
                        />
                      )
                    )}

                  </div>

                </>
              )}

            </div>

          </div>

        </main>

      </div>

      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        category={selectedCategory}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />

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
      icon: GraduationCap,
    },
    {
      label: "Tickets",
      path: "/manager/tickets",
      icon: Users,
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

        const active =
          currentPath === item.path;

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
   MANAGER USER
========================================================= */

function ManagerUser({
  user,
}: {
  user: {
    name?: string;
  };
}) {
  return (
    <div className="shrink-0 border-t border-slate-200 p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
          {user.name
            ?.charAt(0)
            ?.toUpperCase() || "M"}
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

    </div>
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
  value: number | string;
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
   DESKTOP CATEGORY ROW
========================================================= */

function CategoryTableRow({
  category,
  onEdit,
  onStatus,
  statusUpdating,
}: {
  category: TicketCategory;
  onEdit: () => void;
  onStatus: () => void;
  statusUpdating: boolean;
}) {
  return (
    <tr className="group transition hover:bg-blue-50/40">

      {/* CATEGORY */}

      <td className="px-5 py-4 align-middle">

        <div className="min-w-[220px]">

          <p className="text-sm font-bold text-slate-900">
            {category.name}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Created{" "}
            {formatDate(category.created_at)}
          </p>

        </div>

      </td>

      {/* DESCRIPTION */}

      <td className="px-5 py-4 align-middle">

        <p className="max-w-[240px] truncate text-sm text-slate-600">
          {category.description || "-"}
        </p>

      </td>

      {/* PRIORITY */}

      <td className="px-5 py-4 align-middle">

        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClasses(
            category.default_priority
          )}`}
        >
          {formatPriority(
            category.default_priority
          )}
        </span>

      </td>

      {/* SLA */}

      <td className="px-5 py-4 align-middle">

        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-700">

          <Clock className="h-4 w-4 text-slate-400" />

          {category.sla_hours}{" "}
          {category.sla_hours === 1
            ? "hour"
            : "hours"}

        </div>

      </td>

      {/* STATUS */}

      <td className="px-5 py-4 align-middle">

        {category.is_active ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Active

          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-600/20">

            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

            Inactive

          </span>
        )}

      </td>

      {/* ACTIONS */}

      <td className="px-5 py-4 align-middle">

        <div className="flex items-center justify-end gap-2">

          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            onClick={onStatus}
            disabled={statusUpdating}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              category.is_active
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >

            {statusUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : category.is_active ? (
              <XCircle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}

            {category.is_active
              ? "Deactivate"
              : "Activate"}

          </button>

        </div>

      </td>

    </tr>
  );
}

/* =========================================================
   MOBILE CATEGORY CARD
========================================================= */

function CategoryMobileCard({
  category,
  onEdit,
  onStatus,
  statusUpdating,
}: {
  category: TicketCategory;
  onEdit: () => void;
  onStatus: () => void;
  statusUpdating: boolean;
}) {
  return (
    <div className="p-4 sm:p-5">

      {/* TOP */}

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0 flex-1">

          <p className="text-sm font-bold text-slate-900">
            {category.name}
          </p>

          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {category.description ||
              "No description"}
          </p>

        </div>

        {category.is_active ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Active
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-600/20">
            Inactive
          </span>
        )}

      </div>

      {/* DETAILS */}

      <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">

        <div>

          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Priority
          </p>

          <span
            className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${getPriorityClasses(
              category.default_priority
            )}`}
          >
            {formatPriority(
              category.default_priority
            )}
          </span>

        </div>

        <div>

          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            SLA
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">

            <Clock className="h-4 w-4 text-slate-400" />

            {category.sla_hours}{" "}
            {category.sla_hours === 1
              ? "hour"
              : "hours"}

          </p>

        </div>

        <div>

          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Created
          </p>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatDate(category.created_at)}
          </p>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">

        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={onStatus}
          disabled={statusUpdating}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
            category.is_active
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >

          {statusUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : category.is_active ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}

          {category.is_active
            ? "Deactivate"
            : "Activate"}

        </button>

      </div>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyCategories({
  hasSearch,
  onClear,
  onCreate,
}: {
  hasSearch: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Filter className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        {hasSearch
          ? "No matching categories"
          : "No categories found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasSearch
          ? "Try changing or clearing your search."
          : "Create your first ticket category to get started."}
      </p>

      {hasSearch ? (
        <button
          onClick={onClear}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Clear search
        </button>
      ) : (
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      )}

    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function CategoryTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">

      {Array.from({ length: 7 }).map(
        (_, index) => (
          <div key={index}>

            {/* DESKTOP */}

            <div className="hidden animate-pulse xl:grid xl:grid-cols-[1.3fr_1.4fr_0.8fr_0.7fr_0.8fr_1.2fr] xl:items-center xl:gap-4 xl:px-5 xl:py-5">

              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-3 w-24 rounded bg-slate-100" />
              </div>

              <div className="h-4 w-40 rounded bg-slate-100" />

              <div className="h-6 w-20 rounded-full bg-slate-100" />

              <div className="h-4 w-16 rounded bg-slate-100" />

              <div className="h-6 w-20 rounded-full bg-slate-100" />

              <div className="flex justify-end gap-2">
                <div className="h-8 w-16 rounded-lg bg-slate-100" />
                <div className="h-8 w-24 rounded-lg bg-slate-100" />
              </div>

            </div>

            {/* MOBILE */}

            <div className="flex animate-pulse flex-col gap-4 px-4 py-5 xl:hidden sm:px-5">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-100" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>

                <div className="h-6 w-20 shrink-0 rounded-full bg-slate-100" />

              </div>

              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">

                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-slate-100" />
                  <div className="h-5 w-20 rounded-full bg-slate-100" />
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-10 rounded bg-slate-100" />
                  <div className="h-4 w-20 rounded bg-slate-100" />
                </div>

              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <div className="h-10 flex-1 rounded-lg bg-slate-100" />
                <div className="h-10 flex-1 rounded-lg bg-slate-100" />
              </div>

            </div>

          </div>
        )
      )}

    </div>
  );
}