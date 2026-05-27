import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailTemplateRow, OrderEmailEventRow, OrderRow } from "@/lib/supabase/types";

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

const BRAND_PINK = "#E91E8C";
const SITE_URL = "https://bellehairs.vercel.app";

function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHtml(input: string) {
  let html = String(input ?? "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  return html;
}

function renderTemplateString(template: string, vars: Record<string, string>) {
  const source = String(template ?? "");
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const value = vars[key];
    return typeof value === "string" ? value : "";
  });
}

function formatNaira(amount: number) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}

function wrapEmail(params: { title: string; preheader?: string; bodyHtml: string; unsubscribeHref: string }) {
  const preheader = params.preheader ? escapeHtml(params.preheader) : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#000000;padding:18px 22px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-weight:800; letter-spacing:-0.02em; color:${BRAND_PINK}; font-size:18px;">
                        Belle Hairs
                      </div>
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; color:#ffffffb3; font-size:12px; margin-top:2px;">
                        A Home of Wigs and Hairs
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;font-weight:700;">
                        Visit shop →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 22px 8px 22px;">
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px 22px 22px;">
                <div style="border-top:1px solid #eee;padding-top:14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#666;font-size:12px;line-height:18px;">
                  © Belle Hairs | Owerri, Nigeria | 0912 691 4795<br />
                  <a href="${params.unsubscribeHref}" style="color:${BRAND_PINK};text-decoration:underline;">Unsubscribe</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function primaryButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_PINK};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:800;">
    ${escapeHtml(label)}
  </a>`;
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

function orderItemsTable(items: { name: string; quantity: number; unit_price: number }[]) {
  return items
    .map((i) => {
      const lineTotal = (Number(i.unit_price) || 0) * (Number(i.quantity) || 0);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:800;color:#111;font-size:14px;">${escapeHtml(i.name)}</div>
          <div style="color:#666;font-size:12px;margin-top:2px;">Qty ${Number(i.quantity) || 0} • ${formatNaira(Number(i.unit_price) || 0)} each</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-weight:900;color:#111;font-size:14px;">
          ${formatNaira(lineTotal)}
        </td>
      </tr>`;
    })
    .join("");
}

function orderSummaryBoxHtml(params: {
  items: { name: string; quantity: number; unit_price: number }[];
  totalAmount: number;
  deliveryFee: number;
  showFreeDelivery?: boolean;
}) {
  const itemsHtml = orderItemsTable(params.items);
  const showFree = Boolean(params.showFreeDelivery);
  const totalShown = showFree ? Math.max(0, params.totalAmount - params.deliveryFee) : params.totalAmount;
  const deliveryFeeCell = showFree
    ? `<span style="text-decoration:line-through;color:#999;">${formatNaira(params.deliveryFee)}</span>
       <span style="margin-left:8px;color:${BRAND_PINK};font-weight:900;">${formatNaira(0)} FREE</span>`
    : `${formatNaira(params.deliveryFee)}`;

  return `
    <div style="border:1px solid #eee;border-radius:14px;padding:14px;">
      <div style="font-weight:900;color:#111;font-size:14px;margin-bottom:10px;">Order Summary</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding:10px 0;color:#666;font-size:13px;">Delivery fee</td>
          <td align="right" style="padding:10px 0;color:#111;font-weight:900;font-size:13px;">
            ${deliveryFeeCell}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #eee;color:#111;font-weight:900;font-size:14px;">Total</td>
          <td align="right" style="padding:12px 0;border-top:1px solid #eee;color:${BRAND_PINK};font-weight:900;font-size:16px;">
            ${formatNaira(totalShown)}
          </td>
        </tr>
      </table>
    </div>
  `;
}

function paymentInstructionsHtml() {
  return `
    <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
      <div style="font-weight:900;color:#111;font-size:14px;">Payment instructions</div>
      <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">
        Simply make payment via bank transfer and send your proof of payment to <strong>0912 691 4795</strong> on WhatsApp to confirm your order.
      </div>
    </div>
  `;
}

function offerBoxHtml(offer: Record<string, unknown> | null) {
  const o = offer && typeof offer === "object" ? offer : {};
  const discountCode = typeof o.discount_code === "string" ? o.discount_code.trim() : "";
  const discountPercent = Number(o.discount_percent ?? 0);
  const freeDelivery = Boolean(o.free_delivery);
  const freeWigCap = Boolean(o.free_wig_cap);

  const lines: string[] = [];
  if (freeDelivery) lines.push("Free delivery");
  if (discountCode) lines.push(`Discount code: ${discountCode}`);
  if (freeWigCap) lines.push("Free wig cap");

  if (discountCode && Number.isFinite(discountPercent) && discountPercent > 0) {
    return `
      <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;margin:12px 0 16px 0;">
        <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">DISCOUNT</div>
        <div style="font-size:24px;color:${BRAND_PINK};font-weight:900;margin-top:6px;">${Math.round(discountPercent)}% OFF</div>
        <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
          Code: <strong>${escapeHtml(discountCode)}</strong>
        </div>
      </div>
    `;
  }

  if (!lines.length) return "";
  return `
    <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;margin:12px 0 16px 0;">
      <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">OFFER</div>
      <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
        ${escapeHtml(lines.join(" • "))}
      </div>
    </div>
  `;
}

function storeWhatsAppHref(params: { customerName: string; orderId: string; message: string }) {
  const greetingName = params.customerName.trim().split(/\s+/)[0] || params.customerName.trim() || "there";
  const full = `Hi Belle Hairs,\n\n${params.message}\n\nCustomer: ${greetingName}\nOrder ID: ${params.orderId}\n\nI am sending my payment proof now.`;
  return `https://wa.me/2349126914795?text=${encodeURIComponent(full)}`;
}

function reminderMetaFromTemplateKey(key: string) {
  const m = key.match(/^payment_reminder_r([1-5])$/);
  if (!m) return null;
  const n = Number(m[1]);
  const code = (`R${n}` as const);
  const cta =
    code === "R1"
      ? { label: "Complete My Order", message: "I want to complete my order." }
      : code === "R2"
        ? { label: "Secure My Order Now", message: "I want to secure my order now." }
        : code === "R3"
          ? { label: "Claim Free Delivery", message: "I want to claim the FREE delivery offer for my order." }
          : code === "R4"
            ? { label: "Use My Discount", message: "I want to use my discount for this order." }
            : { label: "Claim My Free Wig Cap", message: "I want to claim the FREE wig cap offer for my order." };
  return { code, n, cta };
}

export async function POST(request: Request) {
  const user = await requireAuthed();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const action = String(body.action ?? "").trim();
  const orderId = String(body.orderId ?? "").trim();
  const templateKey = String(body.templateKey ?? "").trim();

  if (!orderId) return NextResponse.json({ ok: false, error: "Missing orderId." }, { status: 400 });
  if (!templateKey) return NextResponse.json({ ok: false, error: "Missing templateKey." }, { status: 400 });
  if (action !== "preview" && action !== "send") {
    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const orderRes = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (orderRes.error) return NextResponse.json({ ok: false, error: orderRes.error.message }, { status: 500 });
  if (!orderRes.data) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  const order = orderRes.data as OrderRow;

  if (String(order.status) !== "order_received") {
    return NextResponse.json({ ok: false, error: "Order is not unpaid (status is not order_received)." }, { status: 400 });
  }

  const templateRes = await supabase
    .from("email_templates")
    .select("*")
    .eq("key", templateKey)
    .maybeSingle();
  if (templateRes.error) return NextResponse.json({ ok: false, error: templateRes.error.message }, { status: 500 });
  if (!templateRes.data) return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  const template = templateRes.data as EmailTemplateRow;

  const reminderMeta = reminderMetaFromTemplateKey(templateKey);
  if (!reminderMeta) {
    return NextResponse.json({ ok: false, error: "This endpoint only supports payment reminder templates." }, { status: 400 });
  }

  const existingEvent = await supabase
    .from("order_email_events")
    .select("*")
    .eq("order_id", orderId)
    .eq("kind", "payment_reminder")
    .eq("reminder_code", reminderMeta.code)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const alreadySent = Boolean(existingEvent.data?.id);
  if (action === "send" && alreadySent) {
    return NextResponse.json(
      { ok: false, error: `Reminder ${reminderMeta.n} has already been sent for this order.` },
      { status: 400 },
    );
  }

  const offer = template.offer && typeof template.offer === "object" ? (template.offer as Record<string, unknown>) : {};
  const discountCode = typeof offer.discount_code === "string" ? offer.discount_code.trim() : "";
  const discountPercent = Number(offer.discount_percent ?? 0);

  const greetingFirstName = order.customer_name.trim().split(/\s+/)[0] || order.customer_name.trim() || "there";
  const ctaMessage =
    reminderMeta.code === "R4" && discountCode
      ? `I want to use the discount code ${discountCode} for my order.`
      : reminderMeta.cta.message;
  const ctaHref = storeWhatsAppHref({
    customerName: order.customer_name,
    orderId: order.id,
    message: ctaMessage,
  });

  const items = parseItemsForEmail(order.items);
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const totalAmount = Number(order.total_amount ?? 0);

  const vars: Record<string, string> = {
    customer_name: escapeHtml(order.customer_name),
    customer_first_name: escapeHtml(greetingFirstName),
    order_id: escapeHtml(order.id),
    order_summary: orderSummaryBoxHtml({
      items,
      totalAmount,
      deliveryFee,
      showFreeDelivery: Boolean(offer.free_delivery),
    }),
    payment_instructions: paymentInstructionsHtml(),
    offer_box: offerBoxHtml(offer),
    offer_discount_code: escapeHtml(discountCode),
    offer_discount_percent: escapeHtml(Number.isFinite(discountPercent) && discountPercent > 0 ? String(Math.round(discountPercent)) : ""),
    cta_href: escapeHtml(ctaHref),
    cta_label: escapeHtml(reminderMeta.cta.label),
    cta_button: primaryButton(ctaHref, reminderMeta.cta.label),
    delivery_eta_box: "",
    source: "",
    headline: "",
    message: "",
  };

  const subject = renderTemplateString(String(template.subject ?? ""), vars);
  const innerBody = sanitizeHtml(renderTemplateString(String(template.body_html ?? ""), vars));
  const html = wrapEmail({
    title: subject,
    preheader: "Payment reminder • Belle Hairs",
    bodyHtml: innerBody,
    unsubscribeHref: unsubscribeUrl(order.customer_email),
  });

  if (action === "preview") {
    return NextResponse.json({
      ok: true,
      alreadySent,
      existingEvent: (existingEvent.data ?? null) as OrderEmailEventRow | null,
      subject,
      html,
    });
  }

  try {
    await sendEmail({ to: order.customer_email, subject, html });
  } catch {
    return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 500 });
  }

  const insertRes = await supabase
    .from("order_email_events")
    .insert({
      order_id: order.id,
      template_key: templateKey,
      template_name: template.name ?? null,
      kind: "payment_reminder",
      reminder_code: reminderMeta.code,
      sent_to: order.customer_email,
      subject,
      body_html: html,
      offer,
      sent_by: user.id,
      sent_by_email: user.email ?? null,
    })
    .select("*")
    .single();

  if (insertRes.error) {
    return NextResponse.json({ ok: false, error: insertRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: insertRes.data as OrderEmailEventRow });
}
