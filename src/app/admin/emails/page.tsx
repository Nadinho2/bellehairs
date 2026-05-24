"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAdminAuth } from "@/lib/admin-auth";
import { useEmailList } from "@/lib/emails";

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(ms);
  }
}

export default function EmailListAdminPage() {
  const auth = useAdminAuth();
  const emailList = useEmailList();

  const counts = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const e of emailList.entries) {
      bySource.set(e.source, (bySource.get(e.source) ?? 0) + 1);
    }
    return bySource;
  }, [emailList.entries]);

  if (!auth.isAuthed) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Admin login required
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Please login to view the email list.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Email List
          </h1>
          <p className="text-sm text-foreground/70">
            Emails collected from popups, footer, and checkout.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to Admin
          </Link>
          <button
            type="button"
            onClick={() => emailList.downloadCsv()}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Export as CSV
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {Array.from(counts.entries()).map(([source, count]) => (
          <span
            key={source}
            className="rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-black"
          >
            {source}: {count}
          </span>
        ))}
        <span className="rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-black">
          Total: {emailList.entries.length}
        </span>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black px-5 py-4 text-xs font-semibold text-white/80">
          <div className="col-span-6 sm:col-span-6">Email</div>
          <div className="col-span-3 sm:col-span-3">Source</div>
          <div className="col-span-3 sm:col-span-3">Date</div>
        </div>

        <div className="divide-y divide-white/10">
          {emailList.entries.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/70">
              No emails collected yet.
            </div>
          ) : (
            emailList.entries.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-12 gap-3 px-5 py-4 text-sm text-white"
              >
                <div className="col-span-12 break-all font-semibold sm:col-span-6">
                  {e.email}
                </div>
                <div className="col-span-6 text-white/80 sm:col-span-3">
                  {e.source}
                </div>
                <div className="col-span-6 text-white/80 sm:col-span-3">
                  {formatDate(e.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

