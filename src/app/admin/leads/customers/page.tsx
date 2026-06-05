"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { TagBadge, AdminPageHeader, EmptyState, LoadingSkeleton } from "@/components/admin/ui";
import type { CustomerRow } from "@/lib/supabase/types";

function fmtNaira(n: number) { return `₦${n.toLocaleString("en-NG")}`; }

export default function CustomersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [tab, setTab] = useState<"all" | "vip">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("customers").select("*").order("last_order_date", { ascending: false, nullsFirst: false }).limit(500);
      setCustomers((data ?? []) as CustomerRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (tab === "vip" && c.tag !== "vip") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.full_name?.toLowerCase().includes(q) && !c.phone?.includes(q) && !c.email?.toLowerCase().includes(q)) return false;
      }
      if (filterTag && c.tag !== filterTag) return false;
      return true;
    });
  }, [customers, search, filterTag, tab]);

  async function updateTag(customerId: string, newTag: string) {
    await supabase.from("customers").update({ tag: newTag }).eq("id", customerId);
    void load();
  }

  if (loading) {
    return <div className="px-4 lg:px-8 py-6"><AdminPageHeader title="Customers" /><LoadingSkeleton rows={8} /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-4">
      <AdminPageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab("all")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${tab === "all" ? "bg-brand text-white" : "border border-border text-white/60"}`}>All</button>
            <button type="button" onClick={() => setTab("vip")} className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${tab === "vip" ? "bg-yellow-500 text-black" : "border border-border text-white/60"}`}>👑 VIP</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-white placeholder:text-white/30 focus:outline-none w-60" />
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-white">
          <option value="">All Tags</option>
          <option value="vip">VIP</option>
          <option value="regular">Regular</option>
          <option value="first_timer">First Timer</option>
          <option value="cold_lead">Cold Lead</option>
        </select>
      </div>

      {tab === "vip" && <p className="text-xs text-yellow-400">Handle with care 💕</p>}

      {filtered.length === 0 ? (
        <EmptyState icon="👥" message="No customers found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Phone", "Email", "State", "Orders", "Spent", "Last Order", "Tag"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-white/40 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-white/5 transition cursor-pointer">
                  <td className="px-3 py-2 text-xs text-white font-medium">{c.full_name}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{c.phone || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{c.email || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{c.state || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white font-medium">{c.total_orders}</td>
                  <td className="px-3 py-2 text-xs text-white font-medium">{fmtNaira(c.total_spent)}</td>
                  <td className="px-3 py-2 text-xs text-white/40">{c.last_order_date ? new Date(c.last_order_date).toLocaleDateString("en-NG") : "—"}</td>
                  <td className="px-3 py-2"><TagBadge tag={c.tag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Modal */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto bg-card border-l border-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selected.full_name}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-white/50 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/40">Contact</p>
                <p className="text-sm text-white">{selected.phone || "—"}</p>
                <p className="text-xs text-white/60">{selected.email || "—"}</p>
                {selected.state ? <p className="text-xs text-white/60">{selected.state}</p> : null}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected.total_orders}</p>
                  <p className="text-[10px] text-white/40">Orders</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-white">{fmtNaira(selected.total_spent)}</p>
                  <p className="text-[10px] text-white/40">Total Spent</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected.total_orders > 0 ? fmtNaira(Math.round(selected.total_spent / selected.total_orders)) : "—"}</p>
                  <p className="text-[10px] text-white/40">Avg Order</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Tag</p>
                <select value={selected.tag} onChange={(e) => { updateTag(selected.id, e.target.value); setSelected({ ...selected, tag: e.target.value as CustomerRow["tag"] }); }} className="h-9 w-full rounded-xl border border-border bg-black/40 px-3 text-xs text-white">
                  <option value="vip">👑 VIP</option>
                  <option value="regular">🔄 Regular</option>
                  <option value="first_timer">🆕 First Timer</option>
                  <option value="cold_lead">❄️ Cold Lead</option>
                </select>
              </div>
              <a
                href={`https://wa.me/${(selected.whatsapp_number || selected.phone || "").replace(/^0/, "234").replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
