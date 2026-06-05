"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import {
  StatusBadge, AdminPageHeader, EmptyState, LoadingSkeleton,
} from "@/components/admin/ui";
import type { LeadRow, ProfileRow } from "@/lib/supabase/types";

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function EnquiriesPage() {
  const { profile } = useAdminAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [staff, setStaff] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<LeadRow | null>(null);
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, sRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("*"),
      ]);
      setLeads((lRes.data ?? []) as LeadRow[]);
      setStaff((sRes.data ?? []) as ProfileRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("leads-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [supabase, load]);

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const unassigned = leads.filter((l) => !l.assigned_to && l.follow_up_status !== "converted");
  const assigned = leads.filter((l) => l.assigned_to && l.follow_up_status !== "converted");
  const converted = leads.filter((l) => l.follow_up_status === "converted");

  async function claimLead(leadId: string) {
    if (!profile) return;
    await supabase.from("leads").update({ assigned_to: profile.id, follow_up_status: "in_conversation" }).eq("id", leadId);
    await supabase.from("staff_activity_log").insert({
      staff_id: profile.id, staff_name: profile.full_name,
      action: "Claimed enquiry", entity_type: "lead", entity_id: leadId,
    });
    void load();
  }

  async function markConverted(leadId: string) {
    await supabase.from("leads").update({ follow_up_status: "converted" }).eq("id", leadId);
    void load();
  }

  async function saveNote() {
    if (!noteModal) return;
    await supabase.from("leads").update({ notes: noteText }).eq("id", noteModal.id);
    setNoteModal(null);
    setNoteText("");
    void load();
  }

  if (loading) {
    return <div className="px-4 lg:px-8 py-6"><AdminPageHeader title="Enquiries" /><LoadingSkeleton rows={8} /></div>;
  }

  function renderTable(leadList: LeadRow[], showClaim?: boolean) {
    if (leadList.length === 0) return <EmptyState icon="💬" message="No enquiries here" />;
    return (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["WhatsApp", "Name", "Enquiry About", "Last Message", "Time", "Status", "Assigned", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-white/40 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leadList.map((l) => {
              const needsFollowUp = l.follow_up_status === "not_contacted" && l.created_at && (Date.now() - new Date(l.created_at).getTime() > 6 * 3600000);
              return (
                <tr key={l.id} className={`hover:bg-white/5 transition ${needsFollowUp ? "bg-yellow-500/5" : ""}`}>
                  <td className="px-3 py-2 text-xs text-white font-mono">{l.whatsapp_number}</td>
                  <td className="px-3 py-2 text-xs text-white">{l.customer_name || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white/60">{l.enquiry_about || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white/60 max-w-[200px] truncate">{l.last_message || "—"}</td>
                  <td className="px-3 py-2 text-xs text-white/40">
                    {timeAgo(l.last_message_at || l.created_at)}
                    {needsFollowUp ? <span className="ml-1 text-[9px] text-yellow-400">⚠️ Follow-up</span> : null}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={l.follow_up_status} /></td>
                  <td className="px-3 py-2 text-xs text-white/60">{l.assigned_to ? staffById.get(l.assigned_to)?.full_name || "—" : "Unassigned"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/${l.whatsapp_number.replace(/^0/, "234").replace(/[^0-9]/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-green-400 hover:underline"
                      >
                        WhatsApp
                      </a>
                      {showClaim || !l.assigned_to ? (
                        <button type="button" onClick={() => claimLead(l.id)} className="text-[10px] text-brand hover:underline">Claim</button>
                      ) : null}
                      {l.follow_up_status !== "converted" ? (
                        <button type="button" onClick={() => markConverted(l.id)} className="text-[10px] text-green-400 hover:underline">Converted</button>
                      ) : null}
                      <button type="button" onClick={() => { setNoteModal(l); setNoteText(l.notes || ""); }} className="text-[10px] text-white/40 hover:text-white hover:underline">Note</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      <AdminPageHeader title="Enquiries" subtitle={`${leads.length} total · ${unassigned.length} unassigned`} />

      {unassigned.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-yellow-400 mb-3">⚡ Unassigned Pool</h2>
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-1">
            {renderTable(unassigned, true)}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Active Enquiries</h2>
        {renderTable(assigned)}
      </div>

      {converted.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-green-400 mb-3">✅ Converted</h2>
          {renderTable(converted)}
        </div>
      ) : null}

      {/* Note Modal */}
      {noteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-white">Note — {noteModal.customer_name || noteModal.whatsapp_number}</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-xl border border-border bg-black/40 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand/40"
              placeholder="Add notes…"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setNoteModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
              <button type="button" onClick={saveNote} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#C2177A]">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
