"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatPrice } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow, OrderStatus, OrderStatusHistoryEntry } from "@/lib/supabase/types";

function toWhatsAppNumber(input: string) {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "order_received":
      return "Order Received";
    case "payment_received":
      return "Payment Received";
    case "order_confirmed":
      return "Order Confirmed";
    case "dispatched":
      return "Dispatched";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

function normalizeStatus(raw: string): OrderStatus {
  if (raw === "pending") return "order_received";
  if (raw === "confirmed") return "order_confirmed";
  if (raw === "delivered") return "delivered";
  if (
    raw === "order_received" ||
    raw === "payment_received" ||
    raw === "order_confirmed" ||
    raw === "dispatched" ||
    raw === "cancelled"
  ) {
    return raw;
  }
  return "order_received";
}

function statusBadge(status: OrderStatus) {
  switch (status) {
    case "order_received":
      return { label: "🟡 Order Received", className: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30" };
    case "payment_received":
      return { label: "🔵 Payment Received", className: "bg-blue-500/20 text-blue-200 border-blue-500/30" };
    case "order_confirmed":
      return { label: "🟣 Order Confirmed", className: "bg-purple-500/20 text-purple-200 border-purple-500/30" };
    case "dispatched":
      return { label: "🟠 Dispatched", className: "bg-orange-500/20 text-orange-200 border-orange-500/30" };
    case "delivered":
      return { label: "🟢 Delivered", className: "bg-green-500/20 text-green-200 border-green-500/30" };
    case "cancelled":
      return { label: "🔴 Cancelled", className: "bg-red-500/20 text-red-200 border-red-500/30" };
  }
}

function formatHistoryLine(e: OrderStatusHistoryEntry) {
  const at = e.at ? new Date(e.at) : null;
  const time = at ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  const date = at ? at.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "";
  const fromLabel = e.from ? statusLabel(e.from) : "—";
  return `${fromLabel} → ${statusLabel(e.to)}${time && date ? ` at ${time} on ${date}` : ""}`;
}

type ReminderSettings = {
  enabled: boolean;
  reminder1_minutes: number;
  reminder2_minutes: number;
  reminder3_minutes: number;
  reminder4_minutes: number;
  reminder5_minutes: number;
  auto_cancel_minutes: number;
  discount_code: string;
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  reminder1_minutes: 60,
  reminder2_minutes: 6 * 60,
  reminder3_minutes: 24 * 60,
  reminder4_minutes: 48 * 60,
  reminder5_minutes: 72 * 60,
  auto_cancel_minutes: 96 * 60,
  discount_code: "BELLE5",
};

type ReminderCode = "R1" | "R2" | "R3" | "R4" | "R5";

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter(Boolean)));
}

function nextDueReminder(params: { ageMinutes: number; remindersSent: string[]; settings: ReminderSettings }) {
  const sent = new Set(params.remindersSent);
  const plan: Array<{ code: ReminderCode; at: number }> = [
    { code: "R1", at: params.settings.reminder1_minutes },
    { code: "R2", at: params.settings.reminder2_minutes },
    { code: "R3", at: params.settings.reminder3_minutes },
    { code: "R4", at: params.settings.reminder4_minutes },
    { code: "R5", at: params.settings.reminder5_minutes },
  ];
  for (const step of plan) {
    if (params.ageMinutes >= step.at && !sent.has(step.code)) return step.code;
  }
  return null;
}

function formatMinutesAsCountdown(m: number) {
  const mins = Math.max(0, Math.floor(m));
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (h <= 0) return `${r} min`;
  if (r === 0) return `${h} hr`;
  return `${h} hr ${r} min`;
}

function remindersLine(remindersSent: string[]) {
  const sent = new Set(remindersSent);
  const parts: string[] = [];
  for (const code of ["R1", "R2", "R3", "R4", "R5"] as const) {
    parts.push(`${sent.has(code) ? "✅" : "⏳"} ${code}`);
  }
  return parts.join(" ");
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (e) throw e;
      setOrders((data ?? []) as OrderRow[]);
    } catch (err) {
      setError((err as Error).message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadAll]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/admin/reminder-settings", { method: "GET" });
          const json = (await res.json()) as { ok?: boolean; settings?: ReminderSettings; defaults?: ReminderSettings };
          if (res.ok && json.ok && json.settings) {
            setReminderSettings(json.settings);
          } else if (json.defaults) {
            setReminderSettings(json.defaults);
          }
        } catch {}
      })();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Orders</h1>
          <p className="text-sm text-foreground/70">View and update customer order status.</p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadAll()}
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Refresh
          </button>
          <Link
            href="/admin/settings"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Reminder settings
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
            <p className="text-sm text-white/70">No orders yet.</p>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-border bg-card p-6 text-white">
              {(() => {
                const currentStatus = normalizeStatus(String(o.status));
                const createdMs = o.created_at ? new Date(o.created_at).getTime() : 0;
                const ageMinutes = createdMs ? Math.floor((Date.now() - createdMs) / 60_000) : 0;
                const remindersSent = uniqueStrings(Array.isArray(o.reminders_sent) ? o.reminders_sent : []);
                const nextDue = nextDueReminder({ ageMinutes, remindersSent, settings: reminderSettings });
                const nextAtMinutes =
                  nextDue === "R1"
                    ? reminderSettings.reminder1_minutes
                    : nextDue === "R2"
                      ? reminderSettings.reminder2_minutes
                      : nextDue === "R3"
                        ? reminderSettings.reminder3_minutes
                        : nextDue === "R4"
                          ? reminderSettings.reminder4_minutes
                          : nextDue === "R5"
                            ? reminderSettings.reminder5_minutes
                            : null;
                const minutesUntilNext = typeof nextAtMinutes === "number" ? Math.max(0, nextAtMinutes - ageMinutes) : null;
                return (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand">Order</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{o.id}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(currentStatus).className}`}
                    >
                      {statusBadge(currentStatus).label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">
                    {o.customer_name} • {o.customer_phone} • {o.customer_email}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {o.delivery_method === "PICKUP_OWERRI"
                      ? "Pickup (Owerri)"
                      : `${o.delivery_address ?? ""}${o.city ? `, ${o.city}` : ""}${
                          o.state ? `, ${o.state}` : ""
                        }`}
                  </p>
                  {o.order_note ? (
                    <p className="mt-2 text-sm text-white/70">Note: {o.order_note}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-white">
                    Total: {formatPrice(Number(o.total_amount ?? 0))}
                    {Number(o.delivery_fee ?? 0) > 0
                      ? ` (Delivery: ${formatPrice(Number(o.delivery_fee ?? 0))})`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                  </p>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs font-semibold text-white/70">Reminders</p>
                    <p className="mt-1 text-sm font-semibold text-white">{remindersLine(remindersSent)}</p>
                    {o.reminder_paused ? (
                      <p className="mt-1 text-xs text-white/70">Paused by admin</p>
                    ) : o.reminder_stopped ? (
                      <p className="mt-1 text-xs text-white/70">Stopped</p>
                    ) : currentStatus !== "order_received" ? (
                      <p className="mt-1 text-xs text-white/70">Not applicable (paid/processed)</p>
                    ) : nextDue ? (
                      <p className="mt-1 text-xs text-white/70">
                        Next: {nextDue}
                        {minutesUntilNext !== null ? ` in ${formatMinutesAsCountdown(minutesUntilNext)}` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/70">No more reminders scheduled</p>
                    )}
                    {o.reminder_offers &&
                    (o.reminder_offers.free_delivery || o.reminder_offers.discount_code || o.reminder_offers.free_wig_cap) ? (
                      <p className="mt-2 text-xs text-white/70">
                        Offers:{" "}
                        {[
                          o.reminder_offers.free_delivery ? "Free delivery" : null,
                          o.reminder_offers.discount_code ? `Discount ${o.reminder_offers.discount_code}` : null,
                          o.reminder_offers.free_wig_cap ? "Free wig cap" : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={currentStatus}
                    onChange={async (e) => {
                      const next = e.target.value as OrderStatus;
                      const ok = window.confirm(
                        `Change status to ${statusLabel(next)}? This will send an email to the customer.`,
                      );
                      if (!ok) return;
                      setSavingId(o.id);
                      try {
                        const res = await fetch("/api/admin/orders", {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ id: o.id, status: next }),
                        });
                        const json = (await res.json()) as {
                          ok?: boolean;
                          error?: string;
                          emailSent?: boolean;
                          historyLogged?: boolean;
                        };
                        if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update status.");
                        if (json.emailSent === false) {
                          window.alert("Status updated, but the email failed to send. Please try again.");
                        }
                        if (json.historyLogged === false) {
                          window.alert(
                            'Status updated, but history could not be saved. Add a "status_history" jsonb column to the orders table to enable history.',
                          );
                        }
                        await loadAll();
                      } catch (err) {
                        alert((err as Error).message || "Failed to update status.");
                      } finally {
                        setSavingId(null);
                      }
                    }}
                    disabled={savingId === o.id}
                    className="h-10 rounded-full border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
                    aria-label="Order status"
                  >
                    <option value="order_received">🟡 Order Received</option>
                    <option value="payment_received">🔵 Payment Received</option>
                    <option value="order_confirmed">🟣 Order Confirmed</option>
                    <option value="dispatched">🟠 Dispatched</option>
                    <option value="delivered">🟢 Delivered</option>
                    <option value="cancelled">🔴 Cancelled</option>
                  </select>
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(o.customer_phone) ?? ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
                  >
                    WhatsApp
                  </a>
                  {currentStatus === "order_received" ? (
                    <>
                      <button
                        type="button"
                        disabled={savingId === o.id}
                        onClick={async () => {
                          const nextAction = o.reminder_paused ? "resume" : "pause";
                          const ok = window.confirm(
                            `${o.reminder_paused ? "Resume" : "Pause"} reminders for this order?`,
                          );
                          if (!ok) return;
                          setSavingId(o.id);
                          try {
                            const res = await fetch("/api/admin/order-reminders", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ id: o.id, action: nextAction }),
                            });
                            const json = (await res.json()) as { ok?: boolean; error?: string };
                            if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update reminders.");
                            await loadAll();
                          } catch (err) {
                            window.alert((err as Error).message || "Failed to update reminders.");
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60 disabled:opacity-60"
                      >
                        {o.reminder_paused ? "Resume reminders" : "Pause reminders"}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === o.id}
                        onClick={async () => {
                          const ok = window.confirm(
                            "Extend auto-cancel deadline by 24 hours? This helps if you’re chatting with the customer.",
                          );
                          if (!ok) return;
                          setSavingId(o.id);
                          try {
                            const res = await fetch("/api/admin/order-reminders", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ id: o.id, action: "extend_cancel_24h" }),
                            });
                            const json = (await res.json()) as { ok?: boolean; error?: string };
                            if (!res.ok || !json.ok) throw new Error(json.error || "Failed to extend deadline.");
                            await loadAll();
                          } catch (err) {
                            window.alert((err as Error).message || "Failed to extend deadline.");
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60 disabled:opacity-60"
                      >
                        Extend 24h
                      </button>
                      <select
                        disabled={savingId === o.id}
                        defaultValue=""
                        onChange={async (e) => {
                          const code = e.target.value as ReminderCode | "";
                          if (!code) return;
                          e.currentTarget.value = "";
                          const ok = window.confirm(`Send ${code} now? This will email the customer immediately.`);
                          if (!ok) return;
                          setSavingId(o.id);
                          try {
                            const res = await fetch("/api/admin/order-reminders", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({
                                id: o.id,
                                action: "trigger_reminder",
                                reminder: code,
                                discount_code: reminderSettings.discount_code,
                              }),
                            });
                            const json = (await res.json()) as { ok?: boolean; error?: string };
                            if (!res.ok || !json.ok) throw new Error(json.error || "Failed to send reminder.");
                            await loadAll();
                          } catch (err) {
                            window.alert((err as Error).message || "Failed to send reminder.");
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="h-10 rounded-full border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
                        aria-label="Send reminder"
                      >
                        <option value="">Send reminder…</option>
                        <option value="R1">Send R1</option>
                        <option value="R2">Send R2</option>
                        <option value="R3">Send R3</option>
                        <option value="R4">Send R4</option>
                        <option value="R5">Send R5</option>
                      </select>
                    </>
                  ) : null}
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  Status history
                </summary>
                {Array.isArray(o.status_history) && o.status_history.length ? (
                  <div className="mt-4 space-y-2 text-sm text-white/70">
                    {(o.status_history as OrderStatusHistoryEntry[]).map((h, idx) => (
                      <p key={`${h.at}-${idx}`}>{formatHistoryLine(h)}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/70">No history logged yet.</p>
                )}
              </details>

              <details className="mt-5 rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  View items JSON
                </summary>
                <pre className="mt-4 overflow-x-auto text-xs text-white/70">
                  {JSON.stringify(o.items ?? null, null, 2)}
                </pre>
              </details>
                  </>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
