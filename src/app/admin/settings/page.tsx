"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Settings = {
  enabled: boolean;
  reminder1_minutes: number;
  reminder2_minutes: number;
  reminder3_minutes: number;
  reminder4_minutes: number;
  reminder5_minutes: number;
  auto_cancel_minutes: number;
  discount_code: string;
};

function clampInt(value: number, min: number, max: number) {
  const n = Math.round(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function minutesToHours(m: number) {
  return Math.round((Number(m) || 0) / 60);
}

function hoursToMinutes(h: number) {
  return clampInt(h, 1, 24 * 30) * 60;
}

export default function AdminReminderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    reminder1_minutes: 60,
    reminder2_minutes: 6 * 60,
    reminder3_minutes: 24 * 60,
    reminder4_minutes: 48 * 60,
    reminder5_minutes: 72 * 60,
    auto_cancel_minutes: 96 * 60,
    discount_code: "BELLE5",
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/admin/reminder-settings", { method: "GET" });
          const json = (await res.json()) as { ok?: boolean; settings?: Settings; error?: string; defaults?: Settings };
          if (!res.ok || !json.ok) {
            setError(json.error || "Failed to load reminder settings.");
            if (json.defaults) setSettings(json.defaults);
          } else if (json.settings) {
            setSettings(json.settings);
          }
        } catch (err) {
          setError((err as Error).message || "Failed to load reminder settings.");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const settingsHours = useMemo(() => {
    return {
      r1: minutesToHours(settings.reminder1_minutes),
      r2: minutesToHours(settings.reminder2_minutes),
      r3: minutesToHours(settings.reminder3_minutes),
      r4: minutesToHours(settings.reminder4_minutes),
      r5: minutesToHours(settings.reminder5_minutes),
      cancel: minutesToHours(settings.auto_cancel_minutes),
    };
  }, [settings.auto_cancel_minutes, settings.reminder1_minutes, settings.reminder2_minutes, settings.reminder3_minutes, settings.reminder4_minutes, settings.reminder5_minutes]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading reminder settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Payment Reminders</h1>
          <p className="text-sm text-foreground/70">Configure automated payment reminder emails.</p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
          {saved ? <p className="text-sm font-semibold text-white">Saved.</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to orders
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setSaved(false);
          try {
            const res = await fetch("/api/admin/reminder-settings", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(settings),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !json.ok) throw new Error(json.error || "Failed to save reminder settings.");
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1500);
          } catch (err) {
            setError((err as Error).message || "Failed to save reminder settings.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Global toggle</p>
              <p className="mt-1 text-sm text-white/70">Turn the entire reminder sequence on or off.</p>
            </div>
            <label className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 accent-brand"
              />
              Enabled
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Timing (hours)</p>
          <p className="mt-1 text-sm text-white/70">Orders are considered unpaid while status is order_received.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="Reminder 1 (R1) after"
              value={String(settingsHours.r1)}
              onChange={(v) => setSettings((prev) => ({ ...prev, reminder1_minutes: hoursToMinutes(v) }))}
            />
            <NumberField
              label="Reminder 2 (R2) after"
              value={String(settingsHours.r2)}
              onChange={(v) => setSettings((prev) => ({ ...prev, reminder2_minutes: hoursToMinutes(v) }))}
            />
            <NumberField
              label="Reminder 3 (R3) after"
              value={String(settingsHours.r3)}
              onChange={(v) => setSettings((prev) => ({ ...prev, reminder3_minutes: hoursToMinutes(v) }))}
            />
            <NumberField
              label="Reminder 4 (R4) after"
              value={String(settingsHours.r4)}
              onChange={(v) => setSettings((prev) => ({ ...prev, reminder4_minutes: hoursToMinutes(v) }))}
            />
            <NumberField
              label="Reminder 5 (R5) after"
              value={String(settingsHours.r5)}
              onChange={(v) => setSettings((prev) => ({ ...prev, reminder5_minutes: hoursToMinutes(v) }))}
            />
            <NumberField
              label="Auto-cancel after"
              value={String(settingsHours.cancel)}
              onChange={(v) => setSettings((prev) => ({ ...prev, auto_cancel_minutes: hoursToMinutes(v) }))}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Discount</p>
          <p className="mt-1 text-sm text-white/70">Used in Reminder 4 (5% off).</p>
          <div className="mt-4 max-w-sm">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Discount code</span>
              <input
                value={settings.discount_code}
                onChange={(e) => setSettings((prev) => ({ ...prev, discount_code: e.target.value.toUpperCase() }))}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}

function NumberField(props: { label: string; value: string; onChange: (n: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        inputMode="numeric"
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value.replace(/[^\d]/g, "")))}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

