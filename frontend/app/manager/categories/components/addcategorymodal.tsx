"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  X,
} from "lucide-react";

import {
  CategoryPriority,
  createCategory,
  TicketCategory,
  updateCategory,
} from "@/lib/category";

interface CategoryModalProps {
  open: boolean;
  mode: "create" | "edit";
  category?: TicketCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

const priorityOptions: CategoryPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const formatPriority = (priority: string) => {
  return priority
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function CategoryModal({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPriority, setDefaultPriority] =
    useState<CategoryPriority>("MEDIUM");
  const [slaHours, setSlaHours] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    slaHours?: string;
    server?: string;
  }>({});

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && category) {
      setName(category.name);
      setDescription(category.description || "");
      setDefaultPriority(category.default_priority);
      setSlaHours(String(category.sla_hours));
    } else {
      setName("");
      setDescription("");
      setDefaultPriority("MEDIUM");
      setSlaHours("");
    }

    setErrors({});
  }, [open, mode, category]);

  if (!open) return null;

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!name.trim()) {
      nextErrors.name = "Category name is required.";
    }

    const sla = Number(slaHours);

    if (!slaHours.trim()) {
      nextErrors.slaHours = "SLA hours is required.";
    } else if (!Number.isFinite(sla) || sla <= 0) {
      nextErrors.slaHours =
        "SLA hours must be greater than 0.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);

      setErrors({});

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        defaultPriority,
        slaHours: Number(slaHours),
      };

      if (mode === "create") {
        await createCategory(payload);
      } else {
        if (!category) {
          setErrors({
            server: "Category information is missing.",
          });
          return;
        }

        await updateCategory(category.id, payload);
      }

      onSuccess();
    } catch (err: any) {
      console.error(
        "Failed to save category:",
        err
      );

      setErrors({
        server:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save category.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {mode === "create" ? (
                <Filter className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                {mode === "create"
                  ? "Add Category"
                  : "Edit Category"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {mode === "create"
                  ? "Create a new ticket category."
                  : "Update category information."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {/* SERVER ERROR */}
            {errors.server && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span className="break-words">
                  {errors.server}
                </span>
              </div>
            )}

            {/* CATEGORY NAME */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Category Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  if (errors.name) {
                    setErrors((previous) => ({
                      ...previous,
                      name: undefined,
                    }));
                  }
                }}
                placeholder="e.g. Technical Support"
                disabled={saving}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />

              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe this category..."
                rows={3}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              />
            </div>

            {/* PRIORITY */}
<div>
  <label className="mb-1.5 block text-sm font-medium text-slate-700">
    Default Priority
  </label>

  <select
    value={defaultPriority}
    onChange={(event) =>
      setDefaultPriority(
        event.target.value as CategoryPriority
      )
    }
    disabled={saving}
    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
  >
    {priorityOptions.map((priority) => (
      <option
        key={priority}
        value={priority}
      >
        {formatPriority(priority)}
      </option>
    ))}
  </select>
</div>

            {/* SLA */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                SLA Hours
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={slaHours}
                  onChange={(event) => {
                    setSlaHours(event.target.value);

                    if (errors.slaHours) {
                      setErrors((previous) => ({
                        ...previous,
                        slaHours: undefined,
                      }));
                    }
                  }}
                  placeholder="24"
                  disabled={saving}
                  className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                    errors.slaHours
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
              </div>

              {errors.slaHours && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.slaHours}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {mode === "create"
                ? "Create Category"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}