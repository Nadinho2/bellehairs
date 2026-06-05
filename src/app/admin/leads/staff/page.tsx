"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AuthProvider";
import { AdminPageHeader, LoadingSkeleton, EmptyState } from "@/components/admin/ui";
import type { ProfileRow, StaffActivityLogRow } from "@/lib/supabase/types";

export default function StaffPage() {
  const { profile } = useAdminAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [staff, setStaff] = useState<ProfileRow[]>([]);
  const [logs, setLogs] = useState<StaffActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [filterStaff, setFilterStaff] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("staff_activity_log").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setStaff((sRes.data ?? []) as ProfileRow[]);
      setLogs((lRes.data ?? []) as StaffActivityLogRow[]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function addStaff() {
    setError("");
    if (!newName || !newEmail || !newPassword) { setError("All fields required"); return; }
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { full_name: newName, role: newRole } },
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: newName, role: newRole });
      }
      setShowAdd(false);
      setNewName(""); setNewEmail(""); setNewPassword("");
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteStaff(staffId: string) {
    if (!confirm("Delete this staff account?")) return;
    await supabase.from("profiles").delete().eq("id", staffId);
    void load();
  }

  const filteredLogs = filterStaff ? logs.filter((l) => l.staff_id === filterStaff) : logs;

  if (loading) {
    return <div className="px-4 lg:px-8 py-6"><AdminPageHeader title="Staff" /><LoadingSkeleton rows={8} /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      <AdminPageHeader
        title="Staff Management"
        subtitle={`${staff.length} accounts`}
        actions={profile?.role === "admin" ? (
          <button type="button" onClick={() => setShowAdd(true)} className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-[#C2177A]">
            + Add Staff
          </button>
        ) : undefined}
      />

      {/* Staff List */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Email", "Role", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-white/40 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition">
                <td className="px-3 py-2 text-xs text-white font-medium">{s.full_name}</td>
                <td className="px-3 py-2 text-xs text-white/60">{s.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.role === "admin" ? "bg-brand/20 text-brand" : "bg-white/10 text-white/60"}`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-white/40">{new Date(s.created_at).toLocaleDateString("en-NG")}</td>
                <td className="px-3 py-2">
                  {s.id !== profile?.id ? (
                    <button type="button" onClick={() => deleteStaff(s.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                  ) : <span className="text-xs text-white/30">You</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity Log */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white">Activity Log</h2>
          <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="h-7 rounded-xl border border-border bg-card px-2 text-[10px] text-white">
            <option value="">All Staff</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        {filteredLogs.length === 0 ? (
          <EmptyState icon="📋" message="No activity yet" />
        ) : (
          <div className="rounded-2xl border border-border bg-card max-h-[400px] overflow-y-auto divide-y divide-border">
            {filteredLogs.map((l) => (
              <div key={l.id} className="px-4 py-2.5 text-xs">
                <span className="text-brand font-medium">{l.staff_name || "Unknown"}</span>
                <span className="text-white/60"> {l.action} </span>
                {l.details ? <span className="text-white/40">— {l.details}</span> : null}
                <span className="text-white/30 ml-2">{new Date(l.created_at).toLocaleString("en-NG")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-white">Add Staff</h3>
            {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
            <div className="mt-4 space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" className="h-10 w-full rounded-xl border border-border bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" type="email" className="h-10 w-full rounded-xl border border-border bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" type="password" className="h-10 w-full rounded-xl border border-border bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "staff")} className="h-10 w-full rounded-xl border border-border bg-black/40 px-3 text-sm text-white">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-border px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
              <button type="button" onClick={addStaff} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#C2177A]">Create</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
