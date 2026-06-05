"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import {
  StatCard, StatusBadge, SourceBadge, AdminPageHeader, EmptyState, LoadingSkeleton,
} from "@/components/admin/ui";
import type { OrderRow, LeadRow } from "@/lib/supabase/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function OverviewPage() {
  const { profile } = useAdminAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isAdmin = profile?.role === "admin";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, lRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setOrders((oRes.data ?? []) as OrderRow[]);
      setLeads((lRes.data ?? []) as LeadRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("overview-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [supabase, load]);

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
  const yesterdayOrders = orders.filter((o) => o.created_at.startsWith(yesterday));

  const revenueToday = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);
  const awaitingPayment = orders.filter((o) => o.status === "order_received").length;
  const confirmed = orders.filter((o) => o.status === "order_confirmed" || o.status === "payment_received").length;
  const dispatched = orders.filter((o) => o.status === "dispatched").length;
  const newEnquiries = leads.filter((l) => l.created_at.startsWith(today) && l.follow_up_status !== "converted").length;

  // Revenue chart data (last 14 days)
  const chartData = useMemo(() => {
    const days: { date: string; website: number; whatsapp: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
      const dayOrders = orders.filter((o) => o.created_at.startsWith(key) && o.status !== "cancelled");
      days.push({
        date: label,
        website: dayOrders.filter((o) => o.source === "website").reduce((s, o) => s + (o.total_amount || 0), 0),
        whatsapp: dayOrders.filter((o) => o.source !== "website").reduce((s, o) => s + (o.total_amount || 0), 0),
      });
    }
    return days;
  }, [orders]);

  const recentOrders = orders.slice(0, 10);

  // Activity feed
  const activityFeed = useMemo(() => {
    const items: { id: string; text: React.ReactNode; time: string; orderId?: string }[] = [];
    for (const o of orders.slice(0, 20)) {
      const displayId = o.order_id_display || o.id.slice(0, 8);
      items.push({
        id: `order-${o.id}`,
        text: (
          <>
            🆕 New order from <span className="text-white font-medium">{o.customer_name}</span> — {fmtNaira(o.total_amount || 0)} <SourceBadge source={o.source} />
          </>
        ),
        time: o.created_at,
        orderId: o.id,
      });
    }
    for (const l of leads.slice(0, 10)) {
      items.push({
        id: `lead-${l.id}`,
        text: (
          <>
            💬 New enquiry about <span className="text-white font-medium">{l.enquiry_about || "product"}</span>
          </>
        ),
        time: l.created_at,
      });
    }
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
  }, [orders, leads]);

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6">
        <AdminPageHeader title="Overview" subtitle="Loading…" />
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      <AdminPageHeader
        title="Overview"
        subtitle={`Welcome back, ${profile?.full_name || "Admin"}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="💰" label="Revenue Today" value={fmtNaira(revenueToday)} hidden={!isAdmin} />
        <StatCard icon="📦" label="New Orders" value={todayOrders.length} trend={`${todayOrders.length - yesterdayOrders.length >= 0 ? "↑" : "↓"} ${Math.abs(todayOrders.length - yesterdayOrders.length)}`} trendUp={todayOrders.length >= yesterdayOrders.length} />
        <StatCard icon="⏳" label="Awaiting Payment" value={awaitingPayment} />
        <StatCard icon="✅" label="Confirmed" value={confirmed} />
        <StatCard icon="🚚" label="Dispatched" value={dispatched} />
        <StatCard icon="💬" label="New Enquiries" value={newEnquiries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Orders */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-brand hover:underline">View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState icon="📦" message="No orders yet today 💕" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">ID</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">Customer</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">Amount</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">Source</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">Status</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-2.5 text-xs font-mono text-brand">{o.order_id_display || o.id.slice(0, 8)}</td>
                        <td className="px-4 py-2.5 text-white text-xs">{o.customer_name}</td>
                        <td className="px-4 py-2.5 text-white text-xs font-medium">{fmtNaira(o.total_amount || 0)}</td>
                        <td className="px-4 py-2.5"><SourceBadge source={o.source} /></td>
                        <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-white/40">{timeAgo(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-white">Live Activity</h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
              {activityFeed.length === 0 ? (
                <EmptyState icon="📭" message="No recent activity" />
              ) : (
                activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 text-xs hover:bg-white/5 transition cursor-pointer"
                    onClick={() => {
                      if (item.orderId) window.location.href = `/admin/orders?id=${item.orderId}`;
                    }}
                  >
                    <p className="text-white/70 leading-relaxed">{item.text}</p>
                    <p className="mt-1 text-[10px] text-white/30">{timeAgo(item.time)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart (Admin only) */}
      {isAdmin ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }}
              />
              <Bar dataKey="website" name="Website" fill="#E91E8C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="whatsapp" name="WhatsApp Bot" fill="#333" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
