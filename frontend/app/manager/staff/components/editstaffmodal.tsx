"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

import {
  updateStaff,
  type Staff,
  type UpdateStaffData,
} from "@/lib/staff";

interface EditStaffModalProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStaffModal({
  open,
  staff,
  onClose,
  onSuccess,
}: EditStaffModalProps) {
  const [form, setForm] = useState<UpdateStaffData>({
    name: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const [submitError, setSubmitError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!open || !staff) return;

    setForm({
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
    });

    setErrors({});
    setSubmitError("");
  }, [open, staff]);

  if (!open || !staff) return null;

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    const name = form.name?.trim() || "";
    const email = form.email?.trim() || "";
    const phone = form.phone?.trim() || "";

    if (!name) nextErrors.name = "Name is required";
    else if (name.length < 2)
      nextErrors.name = "Name must be at least 2 characters";
    else if (name.length > 100)
      nextErrors.name = "Name must not exceed 100 characters";

    if (!email) nextErrors.email = "Email is required";
    else if (email.length > 150)
      nextErrors.email = "Email must not exceed 150 characters";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Invalid email address";

    if (phone.length > 20)
      nextErrors.phone = "Phone number must not exceed 20 characters";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    field: keyof UpdateStaffData,
    value: string
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      setUpdating(true);

      await updateStaff(staff.id, {
        name: form.name?.trim(),
        email: form.email?.trim(),
        phone: form.phone?.trim() || null,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Failed to update staff:", error);
      setSubmitError(
        error?.response?.data?.message ||
          "Failed to update staff member."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (updating) return;
    setErrors({});
    setSubmitError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Save className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Edit Staff
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Update support staff information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={updating}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="edit-staff-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full Name<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="edit-staff-name"
              type="text"
              value={form.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              maxLength={100}
              placeholder="Enter staff name"
              disabled={updating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.name
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-staff-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email<span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="edit-staff-email"
              type="email"
              value={form.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              maxLength={150}
              placeholder="staff@example.com"
              disabled={updating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.email
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-staff-phone"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Phone
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </label>
            <input
              id="edit-staff-phone"
              type="tel"
              value={form.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              maxLength={20}
              placeholder="Enter phone number"
              disabled={updating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.phone
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={updating}
              className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updating}
              className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
