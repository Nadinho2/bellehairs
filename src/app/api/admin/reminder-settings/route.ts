import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentReminderSettingsRow } from "@/lib/supabase/types";

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

const DEFAULTS = {
  enabled: true,
  reminder1_minutes: 60,
  reminder2_minutes: 6 * 60,
  reminder3_minutes: 24 * 60,
  reminder4_minutes: 48 * 60,
  reminder5_minutes: 72 * 60,
  auto_cancel_minutes: 96 * 60,
  discount_code: "BELLE5",
};

export async function GET() {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const res = await supabase.from("payment_reminder_settings").select("*").eq("id", "default").maybeSingle();
  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (msgLower.includes("does not exist") || msgLower.includes("schema cache")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing "payment_reminder_settings" table in Supabase. Create it and reload schema cache.',
          defaults: DEFAULTS,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  }

  const row = (res.data ?? null) as PaymentReminderSettingsRow | null;
  const settings = {
    enabled: row?.enabled ?? DEFAULTS.enabled,
    reminder1_minutes: row?.reminder1_minutes ?? DEFAULTS.reminder1_minutes,
    reminder2_minutes: row?.reminder2_minutes ?? DEFAULTS.reminder2_minutes,
    reminder3_minutes: row?.reminder3_minutes ?? DEFAULTS.reminder3_minutes,
    reminder4_minutes: row?.reminder4_minutes ?? DEFAULTS.reminder4_minutes,
    reminder5_minutes: row?.reminder5_minutes ?? DEFAULTS.reminder5_minutes,
    auto_cancel_minutes: row?.auto_cancel_minutes ?? DEFAULTS.auto_cancel_minutes,
    discount_code: (row?.discount_code ?? DEFAULTS.discount_code).trim() || DEFAULTS.discount_code,
  };

  return NextResponse.json({ ok: true, settings });
}

export async function POST(request: Request) {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const enabled = Boolean(body.enabled);
  const discount_code = String(body.discount_code ?? DEFAULTS.discount_code).trim() || DEFAULTS.discount_code;

  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  };

  const payload: PaymentReminderSettingsRow = {
    id: "default",
    enabled,
    reminder1_minutes: num(body.reminder1_minutes, DEFAULTS.reminder1_minutes),
    reminder2_minutes: num(body.reminder2_minutes, DEFAULTS.reminder2_minutes),
    reminder3_minutes: num(body.reminder3_minutes, DEFAULTS.reminder3_minutes),
    reminder4_minutes: num(body.reminder4_minutes, DEFAULTS.reminder4_minutes),
    reminder5_minutes: num(body.reminder5_minutes, DEFAULTS.reminder5_minutes),
    auto_cancel_minutes: num(body.auto_cancel_minutes, DEFAULTS.auto_cancel_minutes),
    discount_code,
    updated_at: new Date().toISOString(),
  };

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const res = await supabase.from("payment_reminder_settings").upsert(payload, { onConflict: "id" });
  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (
      (msgLower.includes("row-level security") || msgLower.includes("violates row-level security")) &&
      !service
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Reminder settings update was blocked by Supabase RLS. Add policies on public.payment_reminder_settings for authenticated users (or use service role).",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

