"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmailCampaignRow, EmailCampaignSegment, SubscriberRow } from "@/lib/supabase/types";

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

function sanitizeHtml(input: string) {
  let html = String(input ?? "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  return html;
}

function segmentLabel(seg: EmailCampaignSegment) {
  if (seg === "customers") return "Checkout customers";
  if (seg === "leads") return "Popup/Footer subscribers";
  return "All subscribers";
}

function brandPreviewHtml(contentHtml: string) {
  const safe = sanitizeHtml(contentHtml);
  return `
    <div style="background:#f5f5f7;padding:24px 12px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;">
        <div style="background:#000000;padding:18px 22px;">
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-weight:800;letter-spacing:-0.02em;color:#E91E8C;font-size:18px;">
            BelleHairs Owerri
          </div>
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#ffffffb3;font-size:12px;margin-top:2px;">
            A Home of Wigs and Hairs
          </div>
        </div>
        <div style="padding:22px 22px 8px 22px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
          ${safe}
        </div>
        <div style="padding:16px 22px 22px 22px;">
          <div style="border-top:1px solid #eee;padding-top:14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#666;font-size:12px;line-height:18px;">
            © BelleHairs Owerri | Owerri, Nigeria | 0912 691 4795<br />
            <span style="color:#E91E8C;text-decoration:underline;">Unsubscribe</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

const PREBUILT_TEMPLATES = [
  {
    key: "new-arrival",
    label: "New Arrival Alert",
    subject: "🆕 New Hair Just Dropped at BelleHairs! 👀",
    bodyHtml: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
        <h2 style="margin:0 0 10px 0;font-size:20px;letter-spacing:-0.02em;">New Arrival Alert 🆕</h2>
        <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
          Fresh drop just landed. Limited pieces available — grab yours now.
        </p>
        <div style="border:1px solid #eee;border-radius:14px;padding:14px;">
          <img src="https://placehold.co/560x360/png" alt="Product image" style="width:100%;height:auto;border-radius:12px;display:block;" />
          <div style="margin-top:12px;font-weight:900;font-size:16px;">[Product Name]</div>
          <div style="margin-top:4px;color:#666;font-size:13px;">₦[Price]</div>
          <div style="margin-top:12px;">
            <a href="https://bellehairs.vercel.app/products" style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:800;">Shop Now</a>
          </div>
        </div>
      </div>
    `,
  },
  {
    key: "flash-sale",
    label: "Flash Sale",
    subject: "🔥 [X]% Off Today Only — BelleHairs Flash Sale!",
    bodyHtml: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
        <h2 style="margin:0 0 10px 0;font-size:20px;letter-spacing:-0.02em;">Flash Sale 🔥</h2>
        <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
          Today only! Use the code below before time runs out.
        </p>
        <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
          <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">DISCOUNT CODE</div>
          <div style="font-size:24px;color:#E91E8C;font-weight:900;margin-top:6px;">[CODE]</div>
          <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
            Ends at: <strong>[END TIME]</strong>
          </div>
        </div>
        <div style="margin-top:14px;">
          <a href="https://bellehairs.vercel.app/products" style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:800;">Shop Now</a>
        </div>
      </div>
    `,
  },
  {
    key: "restock",
    label: "Restock Alert",
    subject: "✅ It's Back! [Product Name] is Back in Stock",
    bodyHtml: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
        <h2 style="margin:0 0 10px 0;font-size:20px;letter-spacing:-0.02em;">It&apos;s Back in Stock ✅</h2>
        <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
          Your favorite item is available again. Order before it sells out.
        </p>
        <div style="border:1px solid #eee;border-radius:14px;padding:14px;">
          <img src="https://placehold.co/560x360/png" alt="Product image" style="width:100%;height:auto;border-radius:12px;display:block;" />
          <div style="margin-top:12px;font-weight:900;font-size:16px;">[Product Name]</div>
          <div style="margin-top:4px;color:#666;font-size:13px;">₦[Price]</div>
          <div style="margin-top:12px;">
            <a href="https://bellehairs.vercel.app/products" style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:800;">Order Now</a>
          </div>
        </div>
      </div>
    `,
  },
] as const;

function ToolbarButton(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
    >
      {props.label}
    </button>
  );
}

export default function EmailListAdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscribers" | "campaign">("subscribers");

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const [campaigns, setCampaigns] = useState<EmailCampaignRow[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [segment, setSegment] = useState<EmailCampaignSegment>("all");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("subscribers")
          .select("*")
          .order("created_at", { ascending: false });
        if (!alive) return;
        setRows((data ?? []) as SubscriberRow[]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  const refreshCampaigns = useCallback(async () => {
    setCampaignLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { method: "GET" });
      const json = (await res.json()) as { ok?: boolean; campaigns?: EmailCampaignRow[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load campaigns.");
      setCampaigns(json.campaigns ?? []);
    } catch {
      setCampaigns([]);
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "campaign") return;
    const t = window.setTimeout(() => {
      void refreshCampaigns();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refreshCampaigns, tab]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.source, (map.get(r.source) ?? 0) + 1);
    return map;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const emailOk = q ? r.email.toLowerCase().includes(q) : true;
      const sourceOk = sourceFilter === "all" ? true : r.source === sourceFilter;
      return emailOk && sourceOk;
    });
  }, [rows, search, sourceFilter]);

  const insertAtSelection = useCallback((insert: string) => {
    const el = editorRef.current;
    if (!el) {
      setBodyHtml((prev) => prev + insert);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + insert + el.value.slice(end);
    setBodyHtml(next);
    window.setTimeout(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }, []);

  const wrapSelection = useCallback((open: string, close: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end) || "text";
    const insert = open + selected + close;
    const next = el.value.slice(0, start) + insert + el.value.slice(end);
    setBodyHtml(next);
    window.setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + open.length, start + open.length + selected.length);
    }, 0);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Emails</h1>
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
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("subscribers")}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${
            tab === "subscribers"
              ? "bg-brand text-white"
              : "border border-black bg-white text-black hover:border-brand"
          }`}
        >
          Subscriber List
        </button>
        <button
          type="button"
          onClick={() => setTab("campaign")}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${
            tab === "campaign"
              ? "bg-brand text-white"
              : "border border-black bg-white text-black hover:border-brand"
          }`}
        >
          Send Campaign
        </button>
      </div>

      {tab === "subscribers" ? (
        <>
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email..."
                className="h-10 w-full rounded-full border border-black bg-white px-4 text-sm text-black outline-none focus:border-brand sm:w-64"
              />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-10 rounded-full border border-black bg-white px-4 text-sm font-semibold text-black outline-none focus:border-brand"
              >
                <option value="all">All sources</option>
                <option value="popup">popup</option>
                <option value="footer">footer</option>
                <option value="checkout">checkout</option>
                <option value="exit">exit</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const csv = toCsv(filteredRows);
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
              Export CSV
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-black px-5 py-4 text-xs font-semibold text-white/80">
              <div className="col-span-7 sm:col-span-7">Email</div>
              <div className="col-span-2 sm:col-span-2">Source</div>
              <div className="col-span-3 sm:col-span-2">Date</div>
              <div className="hidden sm:col-span-1 sm:block" />
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="px-5 py-10 text-center text-white/70">Loading…</div>
              ) : filteredRows.length === 0 ? (
                <div className="px-5 py-10 text-center text-white/70">
                  No emails match your filters.
                </div>
              ) : (
                filteredRows.map((r) => (
                  <div key={r.id} className="grid grid-cols-12 gap-3 px-5 py-4 text-sm text-white">
                    <div className="col-span-12 break-all font-semibold sm:col-span-7">
                      {r.email}
                    </div>
                    <div className="col-span-6 text-white/80 sm:col-span-2">{r.source}</div>
                    <div className="col-span-6 text-white/80 sm:col-span-2">
                      {formatDate(r.created_at)}
                    </div>
                    <div className="col-span-12 flex justify-end sm:col-span-1 sm:justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Unsubscribe ${r.email}?`)) return;
                          const { error } = await supabase.from("subscribers").delete().eq("id", r.id);
                          if (error) {
                            alert(error.message);
                            return;
                          }
                          setRows((prev) => prev.filter((x) => x.id !== r.id));
                        }}
                        className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 text-white">
              <p className="text-sm font-semibold text-white">Broadcast email</p>
              <p className="mt-2 text-sm text-white/70">
                Send a marketing email to your subscribers.
              </p>

              <form
                className="mt-5 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSendMessage(null);
                  setSending(true);
                  try {
                    const scheduledAt =
                      scheduleEnabled && scheduleAt
                        ? new Date(scheduleAt).toISOString()
                        : null;
                    const res = await fetch("/api/admin/campaigns", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ subject, bodyHtml, segment, scheduledAt }),
                    });
                    const json = (await res.json()) as {
                      ok?: boolean;
                      error?: string;
                      scheduled?: boolean;
                      sentCount?: number;
                    };
                    if (!res.ok || !json.ok) throw new Error(json.error || "Failed to send.");
                    if (json.scheduled) {
                      setSendMessage("✅ Campaign scheduled.");
                    } else {
                      setSendMessage(`✅ Email sent to ${json.sentCount ?? 0} subscribers`);
                    }
                    await refreshCampaigns();
                  } catch (err) {
                    setSendMessage((err as Error).message || "Failed to send.");
                  } finally {
                    setSending(false);
                  }
                }}
              >
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-white">Subject</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                    placeholder="Subject line..."
                    required
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <ToolbarButton label="Bold" onClick={() => wrapSelection("<b>", "</b>")} />
                    <ToolbarButton label="Italic" onClick={() => wrapSelection("<i>", "</i>")} />
                    <ToolbarButton
                      label="Link"
                      onClick={() => {
                        const url = prompt("Enter link URL") || "";
                        if (!url) return;
                        wrapSelection(`<a href="${url}">`, "</a>");
                      }}
                    />
                    <ToolbarButton
                      label="Image"
                      onClick={() => {
                        const url = prompt("Enter image URL") || "";
                        if (!url) return;
                        insertAtSelection(
                          `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:12px;display:block;" />`,
                        );
                      }}
                    />
                    <ToolbarButton
                      label="Button"
                      onClick={() => {
                        const url = prompt("Enter button link") || "";
                        if (!url) return;
                        const text = prompt("Enter button label") || "Shop Now";
                        insertAtSelection(
                          `<a href="${url}" style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:800;">${text}</a>`,
                        );
                      }}
                    />
                  </div>
                  <textarea
                    ref={editorRef}
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    className="min-h-56 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                    placeholder="Write HTML content here..."
                    required
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="rounded-full border border-white/15 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60"
                    >
                      Preview
                    </button>
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value as EmailCampaignSegment)}
                      className="h-10 rounded-full border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      <option value="all">All subscribers</option>
                      <option value="customers">Only checkout (customers)</option>
                      <option value="leads">Only popup/footer (leads)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  Schedule
                </label>

                {scheduleEnabled ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-white">Send date & time</span>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                      required
                    />
                  </label>
                ) : null}

                {sendMessage ? <p className="text-sm font-semibold text-brand">{sendMessage}</p> : null}

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
                >
                  {sending ? "Sending…" : scheduleEnabled ? "Schedule" : "Send Now"}
                </button>
              </form>

              <div className="mt-6">
                <p className="text-sm font-semibold text-white">Ready-made templates</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PREBUILT_TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setSubject(t.subject);
                        setBodyHtml(t.bodyHtml.trim());
                        setSendMessage(null);
                      }}
                      className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">Recent campaigns</p>
                <button
                  type="button"
                  onClick={() => refreshCampaigns()}
                  className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                >
                  Refresh
                </button>
              </div>
              {campaignLoading ? (
                <p className="mt-4 text-sm text-white/70">Loading…</p>
              ) : campaigns.length === 0 ? (
                <p className="mt-4 text-sm text-white/70">No campaigns yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {campaigns.map((c) => (
                    <div key={c.id} className="rounded-3xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm font-semibold text-white">{c.subject}</p>
                      <p className="mt-1 text-xs text-white/60">
                        {segmentLabel(c.segment)} • {c.status} •{" "}
                        {c.scheduled_at ? `Scheduled: ${formatDate(c.scheduled_at)}` : "Sent now"}
                        {typeof c.sent_count === "number" ? ` • Sent: ${c.sent_count}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {previewOpen ? (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black text-white shadow-xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
                  <p className="text-sm font-semibold text-white">Preview</p>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white hover:border-brand"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-white p-5">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: brandPreviewHtml(bodyHtml) }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

