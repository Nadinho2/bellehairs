"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminPageHeader, StatCard, LoadingSkeleton } from "@/components/admin/ui";
import type { OrderRow } from "@/lib/supabase/types";

function fmtNaira(n: number) { return `₦${n.toLocaleString("en-NG")}`; }

const COLORS = ["#E91E8C", "#333", "#888"];

export default function AnalyticsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month" | "last_month">("month");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
      setOrders((data ?? []) as OrderRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const now = new Date();
  const filtered = useMemo(() => {
    const d = new Date();
    let start: Date;
    if (range === "today") { start = new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    else if (range === "week") { start = new Date(d.getTime() - 7 * 86400000); }
    else if (range === "month") { start = new Date(d.getFullYear(), d.getMonth(), 1); }
    else { start = new Date(d.getFullYear(), d.getMonth() - 1, 1); }
    const end = range === "last_month" ? new Date(d.getFullYear(), d.getMonth(), 1) : d;
    return orders.filter((o) => {
      const t = new Date(o.created_at);
      return t >= start && t <= end && o.status !== "cancelled";
    });
  }, [orders, range]);

  const totalRevenue = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgOrder = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;
  const websiteRevenue = filtered.filter((o) => o.source === "website").reduce((s, o) => s + (o.total_amount || 0), 0);
  const whatsappRevenue = filtered.filter((o) => o.source !== "website").reduce((s, o) => s + (o.total_amount || 0), 0);

  const sourceData = [
    { name: "Website", value: websiteRevenue },
    { name: "WhatsApp Bot", value: whatsappRevenue },
  ].filter((d) => d.value > 0);

  // Revenue by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filtered) {
      const items = Array.isArray(o.items) ? o.items as Array<Record<string, unknown>> : [];
      for (const item of items) {
        const cat = String(item.category || "Other");
        map[cat] = (map[cat] || 0) + Number(item.price || 0) * Number(item.quantity || 1);
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Revenue by state
  const stateData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filtered) {
      const st = o.state || "Unknown";
      map[st] = (map[st] || 0) + (o.total_amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  // Daily revenue
  const dailyData = useMemo(() => {
    const days: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
      const rev = orders.filter((o) => o.created_at.startsWith(key) && o.status !== "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0);
      days.push({ date: label, revenue: rev });
    }
    return days;
  }, [orders]);

  // Orders by hour
  const hourlyData = useMemo(() => {
    const hours: { hour: string; orders: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const count = filtered.filter((o) => new Date(o.created_at).getHours() === h).length;
      hours.push({ hour: `${h}:00`, orders: count });
    }
    return hours;
  }, [filtered]);

  if (loading) {
    return <div className="px-4 lg:px-8 py-6"><AdminPageHeader title="Analytics" /><LoadingSkeleton rows={8} /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      <AdminPageHeader
        title="Analytics"
        actions={
          <div className="flex gap-2">
            {(["today", "week", "month", "last_month"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-xl px-3 py-1.5 text-[10px] font-semibold transition ${range === r ? "bg-brand text-white" : "border border-border text-white/60"}`}>
                {{ today: "Today", week: "This Week", month: "This Month", last_month: "Last Month" }[r]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="💰" label="Total Revenue" value={fmtNaira(totalRevenue)} />
        <StatCard icon="📦" label="Orders" value={filtered.length} />
        <StatCard icon="📊" label="Avg Order Value" value={fmtNaira(avgOrder)} />
        <StatCard icon="🏆" label="Best Day" value={fmtNaira(Math.max(...dailyData.map((d) => d.revenue), 0))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Source */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Source</h3>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-white/30 text-center py-8">No data</p>}
        </div>

        {/* Revenue by Category */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }} />
                <Bar dataKey="value" fill="#E91E8C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-white/30 text-center py-8">No data</p>}
        </div>
      </div>

      {/* Revenue by State */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Top Delivery States</h3>
        {stateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="value" fill="#E91E8C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-white/30 text-center py-8">No data</p>}
      </div>

      {/* Daily Revenue */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Daily Revenue — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 9 }} interval={4} />
            <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#E91E8C" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hours */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Peak Order Hours</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="hour" tick={{ fill: "#888", fontSize: 9 }} interval={2} />
            <YAxis tick={{ fill: "#888", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, color: "#fff", fontSize: 12 }} />
            <Bar dataKey="orders" fill="#E91E8C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
