"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Paperclip,
  Plus,
  Ticket,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Category {
  id: number;
  name: string;
  description?: string | null;
  default_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  sla_hours: number;
  active?: boolean;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    subject: "",
    description: "",
  });

  const [attachment, setAttachment] = useState<File | null>(
    null
  );

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

    fetchCategories();
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await api.get("/categories");

      const data = response.data.data;

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data?.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(
        "Unable to load support categories. Please try again."
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const selectedCategory = categories.find(
    (category) =>
      String(category.id) === form.categoryId
  );

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!form.categoryId) {
      setError("Please select a support category.");
      return;
    }

    if (form.subject.trim().length < 5) {
      setError(
        "Subject must contain at least 5 characters."
      );
      return;
    }

    if (form.description.trim().length < 10) {
      setError(
        "Please provide more details about your issue."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/tickets", {
        categoryId: Number(form.categoryId),
        subject: form.subject.trim(),
        description: form.description.trim(),
      });

      const createdTicket = response.data.data;

      /*
       * Ticket creation happens first.
       * Attachment upload is handled separately because
       * the backend uses multipart/form-data for attachments.
       */
      if (attachment && createdTicket?.id) {
        const attachmentData = new FormData();

        attachmentData.append("file", attachment);

        await api.post(
          `/tickets/${createdTicket.id}/attachments`,
          attachmentData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (createdTicket?.id) {
        router.push(
          `/student/tickets/${createdTicket.id}`
        );
      } else {
        router.push("/student/tickets");
      }
    } catch (err: any) {
      console.error("Ticket creation failed:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to create ticket. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachment = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, WEBP, PDF, DOC and DOCX files are allowed."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Attachment must be smaller than 5 MB.");
      return;
    }

    setError("");
    setAttachment(file);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

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
              onClick={() =>
                router.push("/student/tickets")
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() => setMobileMenu(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
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
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Ticket className="h-5 w-5" />
              My Tickets
            </button>

            <button
              onClick={() =>
                router.push("/student/tickets/create")
              }
              className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Ticket
            </button>

          </nav>

          <div className="border-t p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
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

          <div className="mx-auto max-w-4xl p-5 sm:p-8">

            {/* HEADER */}
            <div className="mb-7">

              <button
                onClick={() =>
                  router.push("/student/dashboard")
                }
                className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Student Support
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Create a support ticket
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tell us what you need help with and our
                    support team will review your request.
                  </p>
                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
                  <FileText className="h-6 w-6" />
                </div>

              </div>

            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* FORM HEADER */}
                <div className="border-b bg-slate-50/70 px-5 py-5 sm:px-7">

                  <h2 className="font-semibold text-slate-900">
                    Request details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Provide accurate information so the team
                    can resolve your issue faster.
                  </p>

                </div>

                <div className="space-y-6 p-5 sm:p-7">

                  {/* CATEGORY */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Support category
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    {loadingCategories ? (
                      <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

                        <span className="text-sm text-slate-500">
                          Loading categories...
                        </span>
                      </div>
                    ) : (
                      <select
                        required
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            categoryId: e.target.value,
                          })
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="">
                          Select the type of support you need
                        </option>

                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {selectedCategory && (
                      <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

                        <div className="flex items-start gap-3">

                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <div>
                            <p className="text-sm font-semibold text-blue-900">
                              {selectedCategory.name}
                            </p>

                            {selectedCategory.description && (
                              <p className="mt-1 text-xs leading-5 text-blue-700">
                                {selectedCategory.description}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-2">

                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                Priority:{" "}
                                {selectedCategory.default_priority}
                              </span>

                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                SLA:{" "}
                                {selectedCategory.sla_hours} hours
                              </span>

                            </div>
                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                  {/* SUBJECT */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Subject
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={form.subject}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Briefly describe your issue"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-slate-400">
                        {form.subject.length}/200
                      </span>
                    </div>

                  </div>

                  {/* DESCRIPTION */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <textarea
                      required
                      rows={7}
                      maxLength={5000}
                      value={form.description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description: e.target.value,
                        })
                      }
                      placeholder="Explain your issue in detail. Include relevant dates, documents, or information that may help the support team."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-slate-400">
                        {form.description.length}/5000
                      </span>
                    </div>

                  </div>

                  {/* ATTACHMENT */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Attachment
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        Optional
                      </span>
                    </label>

                    {!attachment ? (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                          <Paperclip className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          Attach a supporting file
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          JPG, PNG, WEBP, PDF, DOC or DOCX · Max 5 MB
                        </p>

                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                          onChange={handleAttachment}
                        />

                      </label>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                            <Paperclip className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {attachment.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {(
                                attachment.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="ml-3 rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>

                      </div>
                    )}

                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                      <p className="text-sm leading-5 text-red-700">
                        {error}
                      </p>

                    </div>
                  )}

                </div>

                {/* FOOTER */}
                <div className="flex flex-col-reverse gap-3 border-t bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

                  <p className="text-xs leading-5 text-slate-400">
                    Your request will be reviewed by the college
                    support team.
                  </p>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/student/dashboard")
                      }
                      disabled={submitting}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        loadingCategories ||
                        categories.length === 0
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Submit Request
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </div>

            </form>

          </div>

        </main>
      </div>
    </div>
  );
}