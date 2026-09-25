"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        studentId: form.studentId,
        phone: form.phone || undefined,
      });

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="relative min-h-screen overflow-hidden">

        {/* BACKGROUND */}
        <img
          src="https://images.pexels.com/photos/6146978/pexels-photo-6146978.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="Students studying together"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-slate-950/75" />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-blue-950/40" />

        {/* CONTENT */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">

          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_500px]">

            {/* LEFT */}
            <div className="hidden text-white lg:block">

              <div className="mb-12 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                  <GraduationCap className="h-7 w-7" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Student Support
                  </h2>

                  <p className="text-sm text-white/50">
                    College Helpdesk Portal
                  </p>
                </div>
              </div>

              <div className="max-w-2xl">

                <div className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold tracking-wider text-blue-300">
                  WELCOME TO CAMPUS SUPPORT
                </div>

                <h1 className="text-5xl font-bold leading-[1.1] tracking-tight xl:text-6xl">
                  One account.
                  <br />
                  <span className="text-blue-400">
                    Complete support.
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
                  Create your student account and manage your
                  campus support requests from one simple portal.
                </p>

                <div className="mt-10 flex gap-10">

                  <div>
                    <p className="text-2xl font-bold">
                      Simple
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      Request Creation
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      Real-time
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      Ticket Updates
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      Secure
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      Student Access
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* REGISTER CARD */}
            <div className="w-full">

              <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/40 sm:p-9">

                {/* MOBILE BRAND */}
                <div className="mb-7 flex items-center gap-3 lg:hidden">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      Student Support
                    </p>

                    <p className="text-xs text-slate-500">
                      College Helpdesk Portal
                    </p>
                  </div>
                </div>

                {/* HEADER */}
                <div className="mb-7">
                  <p className="mb-2 text-sm font-semibold text-blue-600">
                    CREATE ACCOUNT
                  </p>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Join the portal
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Create your student account to raise and
                    track support requests.
                  </p>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* NAME */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full name
                    </label>

                    <div className="relative">
                      <UserRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your full name"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* STUDENT ID + PHONE */}
                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Student ID
                      </label>

                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                        <input
                          type="text"
                          required
                          value={form.studentId}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              studentId: e.target.value,
                            })
                          }
                          placeholder="STU001"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Phone
                      </label>

                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Optional"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            email: e.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            password: e.target.value,
                          })
                        }
                        placeholder="Minimum 8 characters"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Confirm password
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        required
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            confirmPassword:
                              e.target.value,
                          })
                        }
                        placeholder="Repeat your password"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating account..."
                      : "Create account"}

                    {!loading && (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </button>
                </form>

                {/* LOGIN LINK */}
                <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Sign in instead
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}