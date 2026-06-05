"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatPrice } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderEmailEventRow, OrderRow, OrderStatus, OrderStatusHistoryEntry } from "@/lib/supabase/types";

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

type ReminderCode = "R1" | "R2" | "R3" | "R4" | "R5";

function reminderTemplateKey(code: ReminderCode) {
  if (code === "R1") return "payment_reminder_r1";
  if (code === "R2") return "payment_reminder_r2";
  if (code === "R3") return "payment_reminder_r3";
  if (code === "R4") return "payment_reminder_r4";
  return "payment_reminder_r5";
}

function reminderLabel(code: ReminderCode) {
  if (code === "R1") return "Reminder 1";
  if (code === "R2") return "Reminder 2";
  if (code === "R3") return "Reminder 3";
  if (code === "R4") return "Reminder 4";
  return "Reminder 5";
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function offerSummary(offerRaw: unknown) {
  const offer = offerRaw && typeof offerRaw === "object" ? (offerRaw as Record<string, unknown>) : {};
  const parts: string[] = [];
  if (offer.free_delivery) parts.push("Free delivery");
  if (offer.free_wig_cap) parts.push("Free wig cap");
  const code = typeof offer.discount_code === "string" ? offer.discount_code.trim() : "";
  const pct = Number(offer.discount_percent ?? 0);
  if (code && Number.isFinite(pct) && pct > 0) parts.push(`${Math.round(pct)}% off (${code})`);
  else if (code) parts.push(`Discount (${code})`);
  return parts.join(" • ");
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [emailEvents, setEmailEvents] = useState<OrderEmailEventRow[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [reminderModalOrderId, setReminderModalOrderId] = useState<string | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<ReminderCode | "">("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{
    alreadySent: boolean;
    subject: string;
    html: string;
    existingEvent: OrderEmailEventRow | null;
  } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

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

  const loadEmailEvents = useCallback(async (orderIds: string[]) => {
    const ids = Array.from(new Set(orderIds.map((x) => String(x).trim()).filter(Boolean))).slice(0, 200);
    if (!ids.length) {
      setEmailEvents([]);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetch(`/api/admin/order-email-events?ids=${encodeURIComponent(ids.join(","))}`, { method: "GET" });
      const json = (await res.json()) as { ok?: boolean; events?: OrderEmailEventRow[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load order email events.");
      setEmailEvents(json.events ?? []);
    } catch (err) {
      setEmailEvents([]);
      setEventsError((err as Error).message || "Failed to load order email events.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadAll]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadEmailEvents(orders.map((o) => o.id));
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadEmailEvents, orders]);

  const eventsByOrderId = useMemo(() => {
    const map = new Map<string, OrderEmailEventRow[]>();
    for (const e of emailEvents) {
      const id = String(e.order_id ?? "");
      if (!id) continue;
      map.set(id, [...(map.get(id) ?? []), e]);
    }
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => String(b.sent_at ?? "").localeCompare(String(a.sent_at ?? "")));
      map.set(k, v);
    }
    return map;
  }, [emailEvents]);

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
            href="/admin/email-templates"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Email Templates
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
                const orderEvents = eventsByOrderId.get(o.id) ?? [];
                const reminderEvents = orderEvents.filter((e) => String(e.kind) === "payment_reminder");
                const reminderByCode = new Map<ReminderCode, OrderEmailEventRow>();
                for (const e of reminderEvents) {
                  const code = String(e.reminder_code ?? "") as ReminderCode;
                  if (code === "R1" || code === "R2" || code === "R3" || code === "R4" || code === "R5") {
                    if (!reminderByCode.has(code)) reminderByCode.set(code, e);
                  }
                }
                const trackerLine = (["R1", "R2", "R3", "R4", "R5"] as const)
                  .map((code) => `${reminderByCode.has(code) ? "✅" : "⬜"} ${reminderLabel(code)}`)
                  .join(" • ");
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
                    <p className="text-xs font-semibold text-white/70">Payment reminders</p>
                    <p className="mt-1 text-sm font-semibold text-white">{trackerLine}</p>
                    {eventsError ? <p className="mt-2 text-xs text-white/70">{eventsError}</p> : null}
                    {eventsLoading ? <p className="mt-2 text-xs text-white/70">Loading reminder log…</p> : null}
                    {reminderEvents.length ? (
                      <div className="mt-3 space-y-2 text-xs text-white/70">
                        {reminderEvents
                          .slice()
                          .sort((a, b) => String(a.sent_at ?? "").localeCompare(String(b.sent_at ?? "")))
                          .map((e) => (
                            <p key={e.id}>
                              {reminderLabel(String(e.reminder_code ?? "") as ReminderCode)} sent {e.sent_at ? `on ${formatDateTime(e.sent_at)}` : ""}{" "}
                              {e.sent_by_email ? `by ${e.sent_by_email}` : ""}
                              {offerSummary(e.offer) ? ` • Offer: ${offerSummary(e.offer)}` : ""}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-white/70">No reminders sent yet.</p>
                    )}
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
                        onClick={() => {
                          setReminderModalOrderId(o.id);
                          setSelectedReminder("");
                          setPreview(null);
                          setSendError(null);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60 disabled:opacity-60"
                      >
                        Send Payment Reminder
                      </button>
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

      {reminderModalOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b0b0e] p-6 text-white">
            {(() => {
              const order = orders.find((o) => o.id === reminderModalOrderId) ?? null;
              return (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand">Send Payment Reminder</p>
                      <p className="truncate text-sm font-semibold text-white">
                        {order?.customer_name ?? ""} • {order?.customer_email ?? ""}
                      </p>
                      <p className="truncate text-xs text-white/60">Order: {order?.id ?? ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReminderModalOrderId(null);
                        setSelectedReminder("");
                        setPreview(null);
                        setSendError(null);
                      }}
                      className="rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={selectedReminder}
                      onChange={async (e) => {
                        const next = e.target.value as ReminderCode | "";
                        setSelectedReminder(next);
                        setPreview(null);
                        setSendError(null);
                        if (!order || !next) return;
                        setPreviewLoading(true);
                        try {
                          const res = await fetch("/api/admin/order-emails", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              action: "preview",
                              orderId: order.id,
                              templateKey: reminderTemplateKey(next),
                            }),
                          });
                          const json = (await res.json()) as {
                            ok?: boolean;
                            error?: string;
                            alreadySent?: boolean;
                            subject?: string;
                            html?: string;
                            existingEvent?: OrderEmailEventRow | null;
                          };
                          if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load preview.");
                          setPreview({
                            alreadySent: Boolean(json.alreadySent),
                            subject: String(json.subject ?? ""),
                            html: String(json.html ?? ""),
                            existingEvent: (json.existingEvent ?? null) as OrderEmailEventRow | null,
                          });
                        } catch (err) {
                          setSendError((err as Error).message || "Failed to load preview.");
                        } finally {
                          setPreviewLoading(false);
                        }
                      }}
                      className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand/40 sm:max-w-sm"
                      aria-label="Reminder template"
                    >
                      <option value="">Select a reminder…</option>
                      <option value="R1">Reminder 1 — Gentle Nudge</option>
                      <option value="R2">Reminder 2 — Urgency</option>
                      <option value="R3">Reminder 3 — Free Delivery Offer</option>
                      <option value="R4">Reminder 4 — Discount</option>
                      <option value="R5">Reminder 5 — Last Chance + Free Wig Cap</option>
                    </select>

                    <button
                      type="button"
                      disabled={!order || !selectedReminder || previewLoading || savingId === order?.id || preview?.alreadySent}
                      onClick={async () => {
                        if (!order || !selectedReminder) return;
                        const ok = window.confirm("Send this reminder now? The email will be sent immediately.");
                        if (!ok) return;
                        setSavingId(order.id);
                        setSendError(null);
                        try {
                          const res = await fetch("/api/admin/order-emails", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              action: "send",
                              orderId: order.id,
                              templateKey: reminderTemplateKey(selectedReminder),
                            }),
                          });
                          const json = (await res.json()) as { ok?: boolean; error?: string };
                          if (!res.ok || !json.ok) throw new Error(json.error || "Failed to send reminder.");
                          await loadEmailEvents(orders.map((o) => o.id));
                          setReminderModalOrderId(null);
                          setSelectedReminder("");
                          setPreview(null);
                        } catch (err) {
                          setSendError((err as Error).message || "Failed to send reminder.");
                        } finally {
                          setSavingId(null);
                        }
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>

                  {preview?.alreadySent ? (
                    <p className="mt-3 text-sm text-white/70">
                      This reminder was already sent{preview.existingEvent?.sent_at ? ` on ${formatDateTime(preview.existingEvent.sent_at)}` : ""}.
                    </p>
                  ) : null}
                  {sendError ? <p className="mt-3 text-sm font-semibold text-brand">{sendError}</p> : null}

                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white">
                    {previewLoading ? (
                      <div className="p-6">
                        <p className="text-sm text-black/70">Loading preview…</p>
                      </div>
                    ) : preview?.html ? (
                      <iframe title="Email preview" className="h-[70vh] w-full" srcDoc={preview.html} />
                    ) : (
                      <div className="p-6">
                        <p className="text-sm text-black/70">Select a reminder to preview.</p>
                      </div>
                    )}
                  </div>

                  {preview?.subject ? (
                    <p className="mt-3 text-xs text-white/60">
                      Subject: <span className="font-semibold text-white/80">{preview.subject}</span>
                    </p>
                  ) : null}
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
