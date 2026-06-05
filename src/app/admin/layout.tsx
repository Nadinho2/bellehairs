"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAdminAuth } from "@/components/admin/AuthProvider";
import AdminSidebar from "@/components/admin/AdminSidebar";

function AdminGate(props: { children: React.ReactNode }) {
  const { profile, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace("/admin/login");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-white/60">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <main className="pb-20 pt-14 lg:pb-8 lg:pl-64 lg:pt-0">
        {props.children}
      </main>
    </div>
  );
}

export default function AdminLayout(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGate>{props.children}</AdminGate>
    </AuthProvider>
  );
}
