"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatPrice } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow } from "@/lib/supabase/types";

type OrderStatus = OrderRow["status"];

function toWhatsAppNumber(input: string) {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand">Order</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{o.id}</p>
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
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={o.status}
                    onChange={async (e) => {
                      const next = e.target.value as OrderStatus;
                      setSavingId(o.id);
                      try {
                        const { error: e2 } = await supabase
                          .from("orders")
                          .update({ status: next })
                          .eq("id", o.id);
                        if (e2) throw e2;
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
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="delivered">delivered</option>
                  </select>
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(o.customer_phone) ?? ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  View items JSON
                </summary>
                <pre className="mt-4 overflow-x-auto text-xs text-white/70">
                  {JSON.stringify(o.items ?? null, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
