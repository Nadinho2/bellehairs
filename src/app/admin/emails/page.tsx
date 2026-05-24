"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SubscriberRow } from "@/lib/supabase/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toCsv(rows: SubscriberRow[]) {
  const header = ["email", "date", "source"].join(",");
  const lines = rows.map((r) => {
    const email = `"${r.email.replaceAll('"', '""')}"`;
    const date = `"${r.created_at}"`;
    const source = `"${String(r.source).replaceAll('"', '""')}"`;
    return [email, date, source].join(",");
  });
  return [header, ...lines].join("\n");
}

export default function EmailListAdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as SubscriberRow[]))
      .finally(() => setLoading(false));
  }, [supabase]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.source, (map.get(r.source) ?? 0) + 1);
    return map;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Email List</h1>
          <p className="text-sm text-foreground/70">
            Emails collected from popups, footer, checkout, and exit intent.
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
            onClick={() => {
              const csv = toCsv(rows);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `bellehairs-email-list-${new Date().toISOString().slice(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
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
          Total: {rows.length}
        </span>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black px-5 py-4 text-xs font-semibold text-white/80">
          <div className="col-span-6 sm:col-span-6">Email</div>
          <div className="col-span-3 sm:col-span-3">Source</div>
          <div className="col-span-3 sm:col-span-3">Date</div>
        </div>

        <div className="divide-y divide-white/10">
          {loading ? (
            <div className="px-5 py-10 text-center text-white/70">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/70">No emails collected yet.</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-3 px-5 py-4 text-sm text-white">
                <div className="col-span-12 break-all font-semibold sm:col-span-6">{r.email}</div>
                <div className="col-span-6 text-white/80 sm:col-span-3">{r.source}</div>
                <div className="col-span-6 text-white/80 sm:col-span-3">{formatDate(r.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

