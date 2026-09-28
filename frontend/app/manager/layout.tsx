"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      router.replace("/");
      return;
    }

    // Wrong role
    if (user.role !== "MANAGER") {
      if (user.role === "STAFF") {
        router.replace("/staff/dashboard");
      } else if (user.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  // While authentication is being restored
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  // Prevent unauthorized content from rendering
  if (!user || user.role !== "MANAGER") {
    return null;
  }

  return <>{children}</>;
}