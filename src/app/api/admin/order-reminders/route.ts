import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendPaymentReminderEmail, type PaymentReminderCode } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderRow, ReminderOffers } from "@/lib/supabase/types";

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

function isReminderCode(value: unknown): value is PaymentReminderCode {
  return value === "R1" || value === "R2" || value === "R3" || value === "R4" || value === "R5";
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
  const id = String(body.id ?? "").trim();
  const action = String(body.action ?? "").trim();
  const reminder = body.reminder;
  const discountCode = String(body.discount_code ?? "BELLE5").trim() || "BELLE5";

  if (!id) return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { data: existing, error: fetchErr } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

  const order = existing as OrderRow;

  if (action === "pause") {
    const { error } = await supabase.from("orders").update({ reminder_paused: true }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "resume") {
    const { error } = await supabase.from("orders").update({ reminder_paused: false }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "extend_cancel_24h") {
    const current = Number(order.cancel_deadline_extended_hours ?? 0) || 0;
    const next = current + 24;
    const { error } = await supabase
      .from("orders")
      .update({ cancel_deadline_extended_hours: next })
      .eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "trigger_reminder") {
    if (!isReminderCode(reminder)) {
      return NextResponse.json({ ok: false, error: "Invalid reminder code." }, { status: 400 });
    }
    if (order.status !== "order_received") {
      return NextResponse.json({ ok: false, error: "Order is not unpaid (status is not order_received)." }, { status: 400 });
    }
    if (order.reminder_stopped) {
      return NextResponse.json({ ok: false, error: "Reminders are stopped for this order." }, { status: 400 });
    }

    const sent = Array.isArray(order.reminders_sent) ? order.reminders_sent : [];
    const remindersSent = uniqueStrings(sent);
    if (remindersSent.includes(reminder)) {
      return NextResponse.json({ ok: false, error: "That reminder has already been sent for this order." }, { status: 400 });
    }

    const items = parseItemsForEmail(order.items);
    const deliveryFee = Number(order.delivery_fee ?? 0);
    const totalAmount = Number(order.total_amount ?? 0);

    try {
      await sendPaymentReminderEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id,
        reminder,
        items,
        totalAmount,
        deliveryFee,
        discountCode,
      });
    } catch {
      return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 500 });
    }

    const offers: ReminderOffers =
      order.reminder_offers && typeof order.reminder_offers === "object" ? order.reminder_offers : {};
    const nextOffers: ReminderOffers = { ...offers };

    const nextNote = order.order_note ?? "";
    const noteLines = nextNote ? [nextNote] : [];
    if (reminder === "R3") {
      nextOffers.free_delivery = true;
      noteLines.push("[Offer] Free delivery offered if paid today (Reminder 3).");
    }
    if (reminder === "R4") {
      nextOffers.discount_code = discountCode;
      noteLines.push(`[Offer] Discount code offered: ${discountCode} (Reminder 4).`);
    }
    if (reminder === "R5") {
      nextOffers.free_wig_cap = true;
      noteLines.push("[Offer] Free wig cap offered (Reminder 5).");
    }

    const { error } = await supabase.from("orders").update({
      reminders_sent: uniqueStrings([...remindersSent, reminder]),
      reminder_offers: nextOffers,
      order_note: uniqueStrings(noteLines).join("\n"),
    }).eq("id", id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
}
