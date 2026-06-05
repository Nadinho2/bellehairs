"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import {
  StatusBadge, SourceBadge, AdminPageHeader, EmptyState, LoadingSkeleton, ConfirmModal,
} from "@/components/admin/ui";
import type { OrderRow, ProfileRow } from "@/lib/supabase/types";

function fmtNaira(n: number) { return `₦${n.toLocaleString("en-NG")}`; }
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUSES = ["order_received", "payment_received", "order_confirmed", "dispatched", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  order_received: "🟡 Order Received",
  payment_received: "🔵 Payment Received",
  order_confirmed: "🟣 Confirmed",
  dispatched: "🟠 Dispatched",
  delivered: "🟢 Delivered",
};

export default function OrdersPage() {
  const { profile } = useAdminAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [staff, setStaff] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ order: OrderRow; newStatus: string } | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("*"),
      ]);
      setOrders((oRes.data ?? []) as OrderRow[]);
      setStaff((sRes.data ?? []) as ProfileRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [supabase, load]);

  // Auto-open order from URL
  useEffect(() => {
    if (highlightId && orders.length > 0) {
      const found = orders.find((o) => o.id === highlightId);
      if (found) { setSelectedOrder(found); setNotes(found.internal_notes || ""); }
    }
  }, [highlightId, orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (search) {
        const q = search.toLowerCase();
        if (!o.customer_name?.toLowerCase().includes(q) && !o.customer_phone?.includes(q) && !(o.order_id_display || "").toLowerCase().includes(q)) return false;
      }
      if (filterSource && o.source !== filterSource) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      if (profile?.role === "staff" && o.assigned_to && o.assigned_to !== profile.id) return false;
      return true;
    });
  }, [orders, search, filterSource, filterStatus, profile]);

  const byStatus = useMemo(() => {
    const map: Record<string, OrderRow[]> = {};
    for (const s of STATUSES) map[s] = [];
    for (const o of filtered) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [filtered]);

  async function updateStatus(orderId: string, newStatus: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const historyEntry = { from: order.status, to: newStatus, at: new Date().toISOString() };
    const existing = Array.isArray(order.status_history) ? order.status_history : [];
    await supabase.from("orders").update({
      status: newStatus,
      status_history: [...existing, historyEntry],
    }).eq("id", orderId);
    // Log activity
    await supabase.from("staff_activity_log").insert({
      staff_id: profile?.id,
      staff_name: profile?.full_name,
      action: `Changed status to ${newStatus}`,
      entity_type: "order",
      entity_id: orderId,
      details: `${order.order_id_display || orderId.slice(0, 8)}: ${order.status} → ${newStatus}`,
    });
    void load();
  }

  async function assignOrder(orderId: string, staffId: string | null) {
    await supabase.from("orders").update({ assigned_to: staffId }).eq("id", orderId);
    void load();
  }

  async function saveNotes(orderId: string, noteText: string) {
    await supabase.from("orders").update({ internal_notes: noteText }).eq("id", orderId);
    await supabase.from("staff_activity_log").insert({
      staff_id: profile?.id,
      staff_name: profile?.full_name,
      action: "Updated notes",
      entity_type: "order",
      entity_id: orderId,
    });
  }

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  if (loading) {
    return <div className="px-4 lg:px-8 py-6"><AdminPageHeader title="Orders" /><LoadingSkeleton rows={10} /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-4">
      <AdminPageHeader
        title="Orders"
        subtitle={`${orders.length} total orders`}
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setView("kanban")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${view === "kanban" ? "bg-brand text-white" : "border border-border text-white/60 hover:text-white"}`}>Kanban</button>
            <button type="button" onClick={() => setView("table")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${view === "table" ? "bg-brand text-white" : "border border-border text-white/60 hover:text-white"}`}>Table</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, order ID…"
          className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand/40 w-60"
        />
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-white">
          <option value="">All Sources</option>
          <option value="website">Website</option>
          <option value="whatsapp_bot">WhatsApp Bot</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-white">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <div key={status} className="min-w-[280px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-white">{STATUS_LABELS[status]}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{byStatus[status]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(byStatus[status] || []).map((o) => (
                  <div
                    key={o.id}
                    onClick={() => { setSelectedOrder(o); setNotes(o.internal_notes || ""); }}
                    className={`cursor-pointer rounded-xl border p-3 transition hover:border-brand/40 ${
                      o.id === highlightId ? "border-brand bg-brand/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-brand">{o.order_id_display || o.id.slice(0, 8)}</span>
                      <SourceBadge source={o.source} />
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{o.customer_name}</p>
                    <p className="text-xs text-white/50">{o.customer_phone}</p>
                    <p className="mt-1 text-sm font-bold text-white">{fmtNaira(o.total_amount || 0)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-white/30">{timeAgo(o.created_at)}</span>
                      {o.assigned_to ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-[9px] text-brand font-bold">
                          {staffById.get(o.assigned_to)?.full_name?.charAt(0) || "?"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {(byStatus[status] || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-white/30">Empty</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Table View */}
      {view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Customer", "Phone", "Total", "Source", "Status", "Assigned", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-white/40 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-2 text-xs font-mono text-brand">{o.order_id_display || o.id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-xs text-white">{o.customer_name}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{o.customer_phone}</td>
                  <td className="px-3 py-2 text-xs font-medium text-white">{fmtNaira(o.total_amount || 0)}</td>
                  <td className="px-3 py-2"><SourceBadge source={o.source} /></td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2 text-xs text-white/60">{o.assigned_to ? staffById.get(o.assigned_to)?.full_name || "—" : "Unassigned"}</td>
                  <td className="px-3 py-2 text-xs text-white/40">{timeAgo(o.created_at)}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => { setSelectedOrder(o); setNotes(o.internal_notes || ""); }} className="text-xs text-brand hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Order Detail Panel */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-lg h-full overflow-y-auto bg-card border-l border-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selectedOrder.order_id_display || selectedOrder.id.slice(0, 8)}</h2>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-white/50 hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Customer</p>
                <p className="text-sm text-white font-medium">{selectedOrder.customer_name}</p>
                <p className="text-xs text-white/60">{selectedOrder.customer_phone} · {selectedOrder.customer_email}</p>
                {selectedOrder.delivery_address ? <p className="text-xs text-white/60 mt-1">{selectedOrder.delivery_address}</p> : null}
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Items</p>
                <div className="space-y-1">
                  {Array.isArray(selectedOrder.items) ? (selectedOrder.items as Array<Record<string, unknown>>).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-white">{String(item.name || "Item")} × {String(item.quantity || 1)}</span>
                      <span className="text-white/60">{fmtNaira(Number(item.price || 0))}</span>
                    </div>
                  )) : <p className="text-xs text-white/40">No items</p>}
                </div>
                <div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Total</span>
                  <span>{fmtNaira(selectedOrder.total_amount || 0)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Status</p>
                <StatusBadge status={selectedOrder.status} />
                <SourceBadge source={selectedOrder.source} />
              </div>

              {/* Status History */}
              <div>
                <p className="text-xs text-white/40 mb-2">Status Timeline</p>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.status_history) ? (selectedOrder.status_history as Array<Record<string, unknown>>).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">✓</span>
                      <span className="text-white/60">{String(entry.from || "start")} → {String(entry.to)}</span>
                      <span className="text-white/30 ml-auto">{new Date(String(entry.at)).toLocaleString("en-NG")}</span>
                    </div>
                  )) : <p className="text-xs text-white/30">No history</p>}
                </div>
              </div>

              {/* Assign */}
              <div>
                <p className="text-xs text-white/40 mb-1">Assign to</p>
                <select
                  value={selectedOrder.assigned_to || ""}
                  onChange={(e) => assignOrder(selectedOrder.id, e.target.value || null)}
                  className="h-9 w-full rounded-xl border border-border bg-black/40 px-3 text-xs text-white"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
              </div>

              {/* Status Change */}
              <div>
                <p className="text-xs text-white/40 mb-1">Change Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => setConfirmMove({ order: selectedOrder, newStatus: e.target.value })}
                  className="h-9 w-full rounded-xl border border-border bg-black/40 px-3 text-xs text-white"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs text-white/40 mb-1">Internal Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveNotes(selectedOrder.id, notes)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-black/40 p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand/40"
                  placeholder="Add notes about this order…"
                />
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${(selectedOrder.whatsapp_number || selectedOrder.customer_phone || "").replace(/^0/, "234").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
              >
                💬 Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm Status Change */}
      <ConfirmModal
        open={!!confirmMove}
        title="Change Order Status"
        message={confirmMove ? `Move ${confirmMove.order.order_id_display || confirmMove.order.id.slice(0, 8)} to "${STATUS_LABELS[confirmMove.newStatus] || confirmMove.newStatus}"?` : ""}
        onConfirm={() => {
          if (confirmMove) {
            updateStatus(confirmMove.order.id, confirmMove.newStatus);
            setSelectedOrder((prev) => prev && prev.id === confirmMove.order.id ? { ...prev, status: confirmMove.newStatus as OrderRow["status"] } : prev);
            setConfirmMove(null);
          }
        }}
        onCancel={() => setConfirmMove(null)}
      />
    </div>
  );
}
