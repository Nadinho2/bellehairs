import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendOrderStatusEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderEmailItem } from "@/lib/email";
import type { OrderRow, OrderStatus, OrderStatusHistoryEntry } from "@/lib/supabase/types";

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

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === "order_received" ||
    value === "payment_received" ||
    value === "order_confirmed" ||
    value === "dispatched" ||
    value === "delivered" ||
    value === "cancelled"
  );
}

function normalizeExistingStatus(raw: string): OrderStatus {
  if (raw === "pending") return "order_received";
  if (raw === "confirmed") return "order_confirmed";
  if (raw === "delivered") return "delivered";
  if (isOrderStatus(raw)) return raw;
  return "order_received";
}

const STATUS_SEQUENCE: OrderStatus[] = [
  "order_received",
  "payment_received",
  "order_confirmed",
  "dispatched",
  "delivered",
];

function isAllowedTransition(from: OrderStatus, to: OrderStatus) {
  if (to === from) return true;
  if (to === "cancelled") return from !== "delivered";
  if (from === "cancelled") return false;
  if (from === "delivered") return false;
  const fromIdx = STATUS_SEQUENCE.indexOf(from);
  const toIdx = STATUS_SEQUENCE.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

function coerceOrderEmailItems(raw: unknown): OrderEmailItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
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
    .filter(Boolean) as OrderEmailItem[];
}

export async function PATCH(request: Request) {
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
  const nextStatus = body.status;
  if (!id) return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });
  if (!isOrderStatus(nextStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid order status." }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

  const order = existing as OrderRow;
  const fromStatus = normalizeExistingStatus(String((existing as Record<string, unknown>).status ?? ""));

  if (!isAllowedTransition(fromStatus, nextStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid status change: ${fromStatus} → ${nextStatus}. Statuses must follow the correct sequence.`,
      },
      { status: 400 },
    );
  }

  if (fromStatus === nextStatus) {
    return NextResponse.json({ ok: true, emailSent: false, historyLogged: false });
  }

  const nowIso = new Date().toISOString();
  const historyEntry: OrderStatusHistoryEntry = { from: fromStatus, to: nextStatus, at: nowIso };
  const existingHistory = Array.isArray(order.status_history) ? order.status_history : [];

  let historyLogged = true;
  const updatePayloadWithHistory = {
    status: nextStatus,
    status_history: [...existingHistory, historyEntry],
  };

  let updateError = (
    await supabase.from("orders").update(updatePayloadWithHistory).eq("id", id)
  ).error;

  if (updateError) {
    const msgLower = (updateError.message || "").toLowerCase();
    if (msgLower.includes("status_history") && msgLower.includes("does not exist")) {
      historyLogged = false;
      updateError = (await supabase.from("orders").update({ status: nextStatus }).eq("id", id)).error;
    }
  }

  if (updateError) {
    const msg = updateError.message || "Failed to update order status.";
    const msgLower = msg.toLowerCase();
    if (
      (msgLower.includes("row-level security") || msgLower.includes("violates row-level security")) &&
      !service
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Order status update was blocked by Supabase RLS. Add an UPDATE policy on public.orders for authenticated users (or admins), or set SUPABASE_SERVICE_ROLE_KEY on the server.",
        },
        { status: 403 },
      );
    }
    if (msgLower.includes("orders_status_check") || msgLower.includes("violates check constraint")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Orders table status check constraint is still using the old statuses. Update the orders_status_check constraint in Supabase to allow: order_received, payment_received, order_confirmed, dispatched, delivered, cancelled.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const items = coerceOrderEmailItems(order.items);
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const totalAmount = Number(order.total_amount ?? 0);

  let emailSent = true;
  try {
    await sendOrderStatusEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      status: nextStatus,
      items,
      totalAmount,
      deliveryFee,
      deliveryMethod: String(order.delivery_method ?? ""),
      state: order.state ?? null,
      cityOrLga: order.city ?? null,
    });
  } catch {
    emailSent = false;
  }

  return NextResponse.json({ ok: true, emailSent, historyLogged });
}
