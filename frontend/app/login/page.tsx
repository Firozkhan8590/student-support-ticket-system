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

export default function HomePage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(loginForm);

      if (user.role === "STUDENT") {
        router.push("/student/dashboard");
      } else if (user.role === "STAFF") {
        router.push("/staff/dashboard");
      } else if (user.role === "MANAGER") {
        router.push("/manager/dashboard");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (registerForm.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        studentId: registerForm.studentId,
        phone: registerForm.phone || undefined,
      });

      setLoginForm({
        email: registerForm.email,
        password: "",
      });

      setRegisterForm({
        name: "",
        studentId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setIsRegister(false);
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

      {/* HERO / LANDING */}
      <section className="relative min-h-screen overflow-hidden">

        {/* BACKGROUND IMAGE */}
        <img
          src="https://images.pexels.com/photos/6146978/pexels-photo-6146978.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="Students studying together"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-slate-950/75" />

        {/* BLUE GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-blue-950/40" />

        {/* CONTENT */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">

          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_460px]">

            {/* LEFT CONTENT */}
            <div className="hidden text-white lg:block">

              {/* BRAND */}
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

              {/* HERO */}
              <div className="max-w-2xl">

                <div className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold tracking-wider text-blue-300">
                  CAMPUS SUPPORT, SIMPLIFIED
                </div>

                <h1 className="text-5xl font-bold leading-[1.1] tracking-tight xl:text-6xl">
                  Your concerns.
                  <br />
                  <span className="text-blue-400">
                    Our support.
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
                  Raise support requests, track their progress,
                  communicate with staff and get your campus
                  issues resolved — all from one place.
                </p>

                {/* FEATURES */}
                <div className="mt-10 grid max-w-xl grid-cols-3 gap-6">

                  <div>
                    <p className="text-2xl font-bold">
                      24/7
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      Request Access
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      Live
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      Ticket Tracking
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      Secure
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      Student Portal
                    </p>
                  </div>

                </div>
              </div>

              <p className="mt-16 text-xs text-white/30">
                Student Support & Ticket Management System
              </p>
            </div>

            {/* AUTH CARD */}
            <div className="w-full">

              <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/40 sm:p-9">

                {/* MOBILE BRAND */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">

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

                {/* TITLE */}
                <div className="mb-7">

                  <p className="mb-2 text-sm font-semibold text-blue-600">
                    {isRegister
                      ? "CREATE ACCOUNT"
                      : "WELCOME BACK"}
                  </p>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {isRegister
                      ? "Join the portal"
                      : "Sign in to continue"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {isRegister
                      ? "Create your student account and start raising support requests."
                      : "Access your support tickets and campus services."}
                  </p>

                </div>

                {/* ERROR */}
                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* LOGIN */}
                {!isRegister ? (
                  <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                  >

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
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="you@example.com"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          required
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="Enter your password"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loading
                        ? "Signing in..."
                        : "Sign in"}

                      {!loading && (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>

                  </form>
                ) : (

                  /* REGISTER */
                  <form
                    onSubmit={handleRegister}
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
                          value={registerForm.name}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Your full name"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    {/* STUDENT ID / PHONE */}
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
                            value={registerForm.studentId}
                            onChange={(e) =>
                              setRegisterForm({
                                ...registerForm,
                                studentId:
                                  e.target.value,
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
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm({
                                ...registerForm,
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
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
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
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          required
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              password:
                                e.target.value,
                            })
                          }
                          placeholder="Minimum 8 characters"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
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

                    {/* CONFIRM */}
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
                          value={
                            registerForm.confirmPassword
                          }
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loading
                        ? "Creating account..."
                        : "Create account"}

                      {!loading && (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>

                  </form>
                )}

                {/* SWITCH */}
                <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                  <p className="text-sm text-slate-500">
                    {isRegister
                      ? "Already have an account?"
                      : "New to the portal?"}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError("");
                    }}
                    className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {isRegister
                      ? "Sign in instead"
                      : "Create a student account"}
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