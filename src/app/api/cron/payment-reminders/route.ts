import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendOrderStatusEmail, sendPaymentReminderEmail, type PaymentReminderCode } from "@/lib/email";
import type { OrderRow, PaymentReminderSettingsRow, ReminderOffers } from "@/lib/supabase/types";

type SupabaseService = ReturnType<typeof createSupabaseServiceClient>;

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
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

async function fetchSettings(supabase: SupabaseService) {
  const res = await supabase.from("payment_reminder_settings").select("*").eq("id", "default").maybeSingle();
  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (msgLower.includes("does not exist") || msgLower.includes("schema cache")) {
      return { ok: true as const, settings: DEFAULTS, source: "default" as const };
    }
    throw new Error(res.error.message);
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
  return { ok: true as const, settings, source: "supabase" as const };
}

function parseItemsForEmail(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items
    .map((x) => {
      const obj = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
      const name = String(obj?.name ?? "").trim();
      const quantity = Number(obj?.quantity ?? 0);
      const unit_price = Number(obj?.unit_price ?? 0);
      if (!name) return null;
      return {
        name,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit_price: Number.isFinite(unit_price) && unit_price > 0 ? unit_price : 0,
      };
    })
    .filter(Boolean) as { name: string; quantity: number; unit_price: number }[];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter(Boolean)));
}

function nextDueReminder(params: {
  ageMinutes: number;
  remindersSent: string[];
  settings: typeof DEFAULTS;
}): PaymentReminderCode | null {
  const sent = new Set(params.remindersSent);
  const plan: Array<{ code: PaymentReminderCode; at: number }> = [
    { code: "R1", at: params.settings.reminder1_minutes },
    { code: "R2", at: params.settings.reminder2_minutes },
    { code: "R3", at: params.settings.reminder3_minutes },
    { code: "R4", at: params.settings.reminder4_minutes },
    { code: "R5", at: params.settings.reminder5_minutes },
  ];

  for (const step of plan) {
    if (params.ageMinutes >= step.at && !sent.has(step.code)) return step.code;
  }
  return null;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let idx = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (idx < items.length) {
      const current = items[idx];
      idx += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? "";
  const expected = process.env.PAYMENT_REMINDERS_CRON_SECRET ?? process.env.EMAIL_CRON_SECRET ?? "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let supabase: SupabaseService;
  try {
    supabase = createSupabaseServiceClient();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Supabase service client not configured." },
      { status: 500 },
    );
  }

  let settingsInfo: Awaited<ReturnType<typeof fetchSettings>>;
  try {
    settingsInfo = await fetchSettings(supabase);
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message || "Failed to load settings." }, { status: 500 });
  }

  const settings = settingsInfo.settings;
  if (!settings.enabled) return NextResponse.json({ ok: true, processed: 0, skipped: 0, settingsSource: settingsInfo.source });

  const minMinutes = Math.max(1, settings.reminder1_minutes);
  const lteIso = new Date(Date.now() - minMinutes * 60_000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "order_received")
    .eq("reminder_stopped", false)
    .eq("reminder_paused", false)
    .lte("created_at", lteIso)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const orders = (data ?? []) as OrderRow[];
  const now = Date.now();
  let processed = 0;
  let skipped = 0;

  await runWithConcurrency(orders, 4, async (o) => {
    if (!o?.id) return;
    const createdMs = o.created_at ? new Date(o.created_at).getTime() : 0;
    if (!createdMs) return;

    const ageMinutes = Math.floor((now - createdMs) / 60_000);
    const sent = Array.isArray(o.reminders_sent) ? o.reminders_sent : [];
    const remindersSent = uniqueStrings(sent);
    const extraHours = Number(o.cancel_deadline_extended_hours ?? 0) || 0;
    const autoCancelAtMinutes = settings.auto_cancel_minutes + Math.max(0, extraHours) * 60;

    if (ageMinutes >= autoCancelAtMinutes && o.status === "order_received") {
      const nextHistory = Array.isArray(o.status_history) ? o.status_history : [];
      const nowIso = new Date().toISOString();
      const status_history = [
        ...nextHistory,
        { from: "order_received", to: "cancelled", at: nowIso },
      ];

      const payload: Record<string, unknown> = {
        status: "cancelled",
        reminder_stopped: true,
        reminder_paused: false,
        reminders_sent: uniqueStrings([...remindersSent, "AUTO_CANCEL"]),
        status_history,
      };

      let updateErr = (await supabase.from("orders").update(payload).eq("id", o.id)).error;
      if (updateErr) {
        const msgLower = (updateErr.message || "").toLowerCase();
        if (msgLower.includes("status_history") && msgLower.includes("does not exist")) {
          delete payload.status_history;
          updateErr = (await supabase.from("orders").update(payload).eq("id", o.id)).error;
        }
      }

      if (updateErr) {
        skipped += 1;
        return;
      }

      const items = parseItemsForEmail(o.items);
      const deliveryFee = Number(o.delivery_fee ?? 0);
      const totalAmount = Number(o.total_amount ?? 0);
      try {
        await sendOrderStatusEmail({
          to: o.customer_email,
          customerName: o.customer_name,
          status: "cancelled",
          items,
          totalAmount,
          deliveryFee,
          deliveryMethod: String(o.delivery_method ?? ""),
          state: o.state ?? null,
          cityOrLga: o.city ?? null,
        });
      } catch {}

      processed += 1;
      return;
    }

    const due = nextDueReminder({ ageMinutes, remindersSent, settings });
    if (!due) {
      skipped += 1;
      return;
    }

    const items = parseItemsForEmail(o.items);
    const deliveryFee = Number(o.delivery_fee ?? 0);
    const totalAmount = Number(o.total_amount ?? 0);

    try {
      await sendPaymentReminderEmail({
        to: o.customer_email,
        customerName: o.customer_name,
        orderId: o.id,
        reminder: due,
        items,
        totalAmount,
        deliveryFee,
        discountCode: settings.discount_code,
      });
    } catch {
      skipped += 1;
      return;
    }

    const offers: ReminderOffers =
      o.reminder_offers && typeof o.reminder_offers === "object" ? o.reminder_offers : {};

    const nextOffers: ReminderOffers = { ...offers };
    const nextNote = o.order_note ?? "";
    const noteLines = nextNote ? [nextNote] : [];

    if (due === "R3") {
      nextOffers.free_delivery = true;
      noteLines.push("[Offer] Free delivery offered if paid today (Reminder 3).");
    }
    if (due === "R4") {
      nextOffers.discount_code = settings.discount_code;
      noteLines.push(`[Offer] Discount code offered: ${settings.discount_code} (Reminder 4).`);
    }
    if (due === "R5") {
      nextOffers.free_wig_cap = true;
      noteLines.push("[Offer] Free wig cap offered (Reminder 5).");
    }

    const updatePayload: Record<string, unknown> = {
      reminders_sent: uniqueStrings([...remindersSent, due]),
      reminder_offers: nextOffers,
      order_note: uniqueStrings(noteLines).join("\n"),
    };

    const { error: updateErr } = await supabase.from("orders").update(updatePayload).eq("id", o.id);
    if (updateErr) {
      skipped += 1;
      return;
    }

    processed += 1;
  });

  return NextResponse.json({
    ok: true,
    processed,
    skipped,
    settingsSource: settingsInfo.source,
  });
}
