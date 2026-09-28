"use client";

import { useState } from "react";
import { Eye, EyeOff, UserPlus, X } from "lucide-react";

import {
  createStaff,
  type CreateStaffData,
} from "@/lib/staff";

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStaffModal({
  open,
  onClose,
  onSuccess,
}: AddStaffModalProps) {
  const [form, setForm] = useState<CreateStaffData>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  }>({});

  const [submitError, setSubmitError] = useState("");

  const [creating, setCreating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  if (!open) {
    return null;
  }

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone?.trim() || "";
    const password = form.password;

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name =
        "Name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name =
        "Name must not exceed 100 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (email.length > 150) {
      newErrors.email =
        "Email must not exceed 150 characters";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters";
    } else if (password.length > 100) {
      newErrors.password =
        "Password must not exceed 100 characters";
    }

    if (phone.length > 20) {
      newErrors.phone =
        "Phone number must not exceed 20 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------
  // INPUT CHANGE
  // --------------------------------------------------

  const handleChange = (
    field: keyof CreateStaffData,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitError("");
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      const payload: CreateStaffData = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone?.trim() || undefined,
      };

      await createStaff(payload);

      // Refresh staff list
      onSuccess();

      // Reset form
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
      });

      setErrors({});
      setSubmitError("");
    } catch (error: any) {
      console.error(
        "Failed to create staff:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Failed to create staff member.";

      setSubmitError(message);
    } finally {
      setCreating(false);
    }
  };

  // --------------------------------------------------
  // CLOSE
  // --------------------------------------------------

  const handleClose = () => {
    if (creating) return;

    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
    });

    setErrors({});
    setSubmitError("");
    setShowPassword(false);

    onClose();
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Add Staff
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Create a new support staff account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==========================================
            FORM
        ========================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-5"
        >
          {/* NAME */}

          <div>
            <label
              htmlFor="staff-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="staff-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                handleChange(
                  "name",
                  event.target.value
                )
              }
              maxLength={100}
              placeholder="Enter staff name"
              disabled={creating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.name
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />

            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* EMAIL */}

          <div>
            <label
              htmlFor="staff-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                handleChange(
                  "email",
                  event.target.value
                )
              }
              maxLength={150}
              placeholder="staff@example.com"
              disabled={creating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.email
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />

            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* PHONE */}

          <div>
            <label
              htmlFor="staff-phone"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Phone
              <span className="ml-1 text-xs font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <input
              id="staff-phone"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                handleChange(
                  "phone",
                  event.target.value
                )
              }
              maxLength={20}
              placeholder="Enter phone number"
              disabled={creating}
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                errors.phone
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />

            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.phone}
              </p>
            )}
          </div>

          {/* PASSWORD */}

          <div>
            <label
              htmlFor="staff-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <input
                id="staff-password"
                type={
                  showPassword ? "text" : "password"
                }
                value={form.password}
                onChange={(event) =>
                  handleChange(
                    "password",
                    event.target.value
                  )
                }
                minLength={8}
                maxLength={100}
                placeholder="Create password"
                disabled={creating}
                className={`h-11 w-full rounded-xl border bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 ${
                  errors.password
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={creating}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-1.5 text-xs text-slate-400">
              Password must be at least 8 characters.
            </p>

            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {/* SERVER ERROR */}

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* ==========================================
              ACTIONS
          ========================================== */}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating...
                </span>
              ) : (
                "Create Staff"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}