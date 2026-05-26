import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendOrderStatusEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type IncomingOrderItem = {
  name: string;
  quantity: number;
  unit_price: number;
};

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const customer_name = String(body.customer_name ?? "").trim();
  const customer_email = normalizeEmail(String(body.customer_email ?? ""));
  const delivery_method = String(body.delivery_method ?? "");
  const delivery_fee = Number(body.delivery_fee ?? 0);
  const total_amount = Number(body.total_amount ?? 0);
  const itemsRaw = Array.isArray(body.items) ? body.items : [];
  const items = itemsRaw as IncomingOrderItem[];

  if (customer_name.length < 2) {
    return NextResponse.json({ ok: false, error: "Customer name is required." }, { status: 400 });
  }
  if (!isValidEmail(customer_email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!delivery_method) {
    return NextResponse.json({ ok: false, error: "Delivery method is required." }, { status: 400 });
  }
  if (!Number.isFinite(total_amount) || total_amount <= 0) {
    return NextResponse.json({ ok: false, error: "Total amount is invalid." }, { status: 400 });
  }
  if (!items.length) {
    return NextResponse.json({ ok: false, error: "Order items are required." }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const { error: subscriberError } = await supabase
    .from("subscribers")
    .upsert({ email: customer_email, source: "checkout" }, { onConflict: "email" });
  if (subscriberError) {
    return NextResponse.json({ ok: false, error: subscriberError.message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    customer_name,
    customer_email,
    customer_phone: String(body.customer_phone ?? ""),
    customer_phone_2: body.customer_phone_2 ?? null,
    delivery_address: body.delivery_address ?? null,
    state: body.state ?? null,
    city: body.city ?? null,
    delivery_method,
    delivery_fee,
    order_note: body.order_note ?? null,
    items: body.items ?? [],
    total_amount,
    status: "order_received",
    status_history: [{ from: null, to: "order_received", at: nowIso }],
  };

  const firstInsert = await supabase.from("orders").insert(insertPayload).select("id").single();
  let orderData = (firstInsert.data as { id: string } | null) ?? null;
  let orderError = firstInsert.error;

  if (orderError) {
    const msgLower = (orderError.message || "").toLowerCase();
    if (msgLower.includes("status_history") && msgLower.includes("does not exist")) {
      delete insertPayload.status_history;
      const retry = await supabase.from("orders").insert(insertPayload).select("id").single();
      orderError = retry.error;
      orderData = (retry.data as { id: string } | null) ?? null;
    }
  }

  if (orderError) {
    return NextResponse.json({ ok: false, error: orderError.message }, { status: 500 });
  }

  let emailSent = true;
  try {
    await sendOrderStatusEmail({
      to: customer_email,
      customerName: customer_name,
      status: "order_received",
      items: items.map((i) => ({
        name: String(i?.name ?? ""),
        quantity: Number(i?.quantity ?? 0),
        unit_price: Number(i?.unit_price ?? 0),
      })),
      totalAmount: total_amount,
      deliveryFee: delivery_fee,
      deliveryMethod: delivery_method,
      state: (body.state as string | null) ?? null,
      cityOrLga: (body.city as string | null) ?? null,
    });
  } catch {
    emailSent = false;
  }

  return NextResponse.json({ ok: true, orderId: orderData?.id ?? null, emailSent });
}
