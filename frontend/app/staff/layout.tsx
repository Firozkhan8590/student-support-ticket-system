"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (user.role !== "STAFF") {
      if (user.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else if (user.role === "MANAGER") {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "STAFF") {
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

  return <>{children}</>;
}