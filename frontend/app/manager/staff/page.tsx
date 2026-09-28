"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Edit,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Ticket,
  UserCheck,
  UserCog,
  UserX,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import AddStaffModal from "./components/addstaffmodal";
import {
  getAllStaff,
  updateStaffStatus,
  type Staff,
} from "@/lib/staff";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function StaffManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // AUTH + INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (user.role !== "MANAGER") {
      if (user.role === "STAFF") {
        router.push("/staff/dashboard");
      } else if (user.role === "STUDENT") {
        router.push("/student/dashboard");
      } else {
        router.push("/");
      }

      return;
    }

    fetchStaff();
  }, [user, authLoading, router]);

  // --------------------------------------------------
  // FETCH STAFF
  // --------------------------------------------------

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllStaff();

      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError("Failed to load staff members.");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FILTER STAFF
  // --------------------------------------------------

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        (member.phone || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && member.is_active) ||
        (statusFilter === "INACTIVE" && !member.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [staff, search, statusFilter]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalStaff = staff.length;

  const activeStaff = staff.filter(
    (member) => member.is_active
  ).length;

  const inactiveStaff = staff.filter(
    (member) => !member.is_active
  ).length;

  // --------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // --------------------------------------------------

  const handleStatusChange = async (member: Staff) => {
    try {
      setStatusUpdatingId(member.id);
      setError("");

      const updatedStaff = await updateStaffStatus(
        member.id,
        !member.is_active
      );

      setStaff((current) =>
        current.map((item) =>
          item.id === member.id
            ? updatedStaff
            : item
        )
      );
    } catch (err: any) {
      console.error("Failed to update staff status:", err);

      const message =
        err?.response?.data?.message ||
        "Failed to update staff status.";

      setError(message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // --------------------------------------------------
  // LOADING / AUTH
  // --------------------------------------------------

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading staff management...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ==================================================
          MOBILE HEADER
      ================================================== */}

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
          aria-label="Toggle menu"
        >
          {mobileMenu ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* ==================================================
          MOBILE MENU
      ================================================== */}

      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-20 border-b bg-white p-4 shadow-lg lg:hidden">
          <nav className="space-y-1">
            <button
              onClick={() => {
                setMobileMenu(false);
                router.push("/manager/dashboard");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                router.push("/manager/tickets");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Ticket className="h-5 w-5" />
              Tickets
            </button>

            <button
              onClick={() => setMobileMenu(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <UserCog className="h-5 w-5" />
              Staff Management
            </button>

            <button
              onClick={() => {
                setMobileMenu(false);
                router.push("/manager/settings");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Settings className="h-5 w-5" />
              Settings
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

      {/* ==================================================
          DESKTOP LAYOUT
      ================================================== */}

      <div className="flex min-h-screen">
        {/* ==================================================
            SIDEBAR
        ================================================== */}

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
              onClick={() =>
                router.push("/manager/dashboard")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/manager/tickets")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Ticket className="h-5 w-5" />
              Tickets
            </button>

            <button
              onClick={() =>
                router.push("/manager/staff")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <UserCog className="h-5 w-5" />
              Staff Management
            </button>
          </nav>

          {/* USER / LOGOUT */}

          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user?.name?.charAt(0).toUpperCase()}
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
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-5 sm:p-8">
            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  onClick={() =>
                    router.push("/manager/dashboard")
                  }
                  className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </button>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Staff Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage support staff members and their access.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Staff
              </button>
            </div>

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* TOTAL */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Staff
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {totalStaff}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserCog className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* ACTIVE */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Active Staff
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {activeStaff}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* INACTIVE */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Inactive Staff
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {inactiveStaff}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <UserX className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ==================================================
                FILTER CARD
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* SEARCH */}

                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search by name, email or phone..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* STATUS */}

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

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {/* ==================================================
                RESULT COUNT
            ================================================== */}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredStaff.length}
                </span>{" "}
                {filteredStaff.length === 1
                  ? "staff member"
                  : "staff members"}
              </p>

              {(search || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* ==================================================
                STAFF LIST
            ================================================== */}

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="divide-y divide-slate-100">
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
              ) : filteredStaff.length === 0 ? (
                /* EMPTY */

                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    {search || statusFilter !== "ALL" ? (
                      <Search className="h-7 w-7" />
                    ) : (
                      <UserCog className="h-7 w-7" />
                    )}
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900">
                    {search || statusFilter !== "ALL"
                      ? "No matching staff"
                      : "No staff members yet"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    {search || statusFilter !== "ALL"
                      ? "Try changing your search or filters."
                      : "Add a staff member and they will appear here."}
                  </p>

                  {!search &&
                    statusFilter === "ALL" && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Staff
                      </button>
                    )}
                </div>
              ) : (
                <>
                  {/* ==================================================
                      DESKTOP TABLE
                  ================================================== */}

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70">
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Staff
                          </th>

                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Phone
                          </th>

                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Role
                          </th>

                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredStaff.map((member) => (
                          <tr
                            key={member.id}
                            className="transition hover:bg-slate-50"
                          >
                            {/* STAFF */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                  {member.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {member.name}
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* PHONE */}

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {member.phone || "-"}
                            </td>

                            {/* ROLE */}

                            <td className="px-5 py-4">
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                STAFF
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              {member.is_active ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/manager/staff/${member.id}/edit`
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                  title="Edit staff"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>

                                <button
                                  onClick={() =>
                                    handleStatusChange(member)
                                  }
                                  disabled={
                                    statusUpdatingId ===
                                    member.id
                                  }
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                                    member.is_active
                                      ? "border-red-200 text-red-500 hover:bg-red-50"
                                      : "border-green-200 text-green-600 hover:bg-green-50"
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                  title={
                                    member.is_active
                                      ? "Deactivate staff"
                                      : "Activate staff"
                                  }
                                >
                                  {statusUpdatingId ===
                                  member.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : member.is_active ? (
                                    <UserX className="h-4 w-4" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ==================================================
                      MOBILE STAFF CARDS
                  ================================================== */}

                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredStaff.map((member) => (
                      <div
                        key={member.id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {member.name}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {member.email}
                                </p>
                              </div>

                              {member.is_active ? (
                                <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">
                                  Active
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700">
                                STAFF
                              </span>

                              {member.phone && (
                                <span className="text-xs text-slate-400">
                                  {member.phone}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/manager/staff/${member.id}/edit`
                                  )
                                }
                                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  handleStatusChange(member)
                                }
                                disabled={
                                  statusUpdatingId ===
                                  member.id
                                }
                                className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-medium ${
                                  member.is_active
                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                    : "border-green-200 text-green-600 hover:bg-green-50"
                                } disabled:opacity-50`}
                              >
                                {statusUpdatingId ===
                                member.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : member.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <AddStaffModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          await fetchStaff();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
