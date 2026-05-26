import "server-only";

import { Resend } from "resend";

import { defaultDeliveryFeeConfig, getDeliveryQuote } from "@/lib/delivery";
import type { OrderStatus } from "@/lib/supabase/types";

const FROM = `"BelleHairs Owerri 💕" <hello@boomkas.com>`;
const BRAND_PINK = "#E91E8C";
const SITE_URL = "https://bellehairs.vercel.app";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  return new Resend(apiKey);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNaira(amount: number) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}

function wrapEmail(params: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  unsubscribeHref: string;
}) {
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
                        BelleHairs Owerri
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
                  © BelleHairs Owerri | Owerri, Nigeria | 0912 691 4795<br />
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

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });
  if (error) throw new Error(error.message);
}

export type OrderEmailItem = {
  name: string;
  quantity: number;
  unit_price: number;
};

export async function sendWelcomeEmail(params: { to: string; source: string }) {
  const bodyHtml = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
      <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Welcome to the BelleHairs VIP List 👑</h1>
      <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
        You&apos;re officially on the list. Get first access to new arrivals, flash sales, and exclusive deals.
      </p>
      <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px 14px;margin:12px 0 16px 0;">
        <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">YOUR 10% CODE</div>
        <div style="font-size:26px;color:${BRAND_PINK};font-weight:900;letter-spacing:0.02em;margin-top:6px;">BELLE10</div>
        <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
          Use this code at checkout to get 10% off your first order.
        </div>
      </div>
      <p style="margin:0 0 16px 0;color:#444;line-height:22px;font-size:14px;">
        Ready to shop? Tap below.
      </p>
      ${primaryButton(`${SITE_URL}/products`, "Shop BelleHairs")}
      <p style="margin:16px 0 0 0;color:#666;line-height:20px;font-size:12px;">
        Subscribed via: ${escapeHtml(params.source)}
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Welcome to the BelleHairs VIP List 👑",
    html: wrapEmail({
      title: "Welcome to the BelleHairs VIP List",
      preheader: "Your 10% code: BELLE10",
      bodyHtml,
      unsubscribeHref: unsubscribeUrl(params.to),
    }),
  });
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "order_received":
      return "Order Received";
    case "payment_received":
      return "Payment Received";
    case "order_confirmed":
      return "Order Confirmed";
    case "dispatched":
      return "Dispatched";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

function orderItemsTable(items: OrderEmailItem[]) {
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

function estimateDeliveryLabel(params: {
  deliveryMethod: string;
  state: string | null;
  cityOrLga: string | null;
}) {
  const state = params.state ?? "";
  const cityOrLga = params.cityOrLga ?? "";
  const quote =
    state || params.deliveryMethod === "PICKUP_OWERRI"
      ? getDeliveryQuote({
          config: defaultDeliveryFeeConfig,
          deliveryMethod:
            params.deliveryMethod === "PICKUP_OWERRI" ? "PICKUP_OWERRI" : "HOME_DELIVERY",
          state,
          cityOrLga,
        })
      : null;

  if (quote?.kind === "pickup") return quote.label;
  if (quote?.kind === "delivery") return quote.durationLabel;
  return null;
}

export async function sendOrderStatusEmail(params: {
  to: string;
  customerName: string;
  status: OrderStatus;
  items: OrderEmailItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryMethod: string;
  state: string | null;
  cityOrLga: string | null;
}) {
  const itemsHtml = orderItemsTable(params.items);
  const eta = estimateDeliveryLabel({
    deliveryMethod: params.deliveryMethod,
    state: params.state,
    cityOrLga: params.cityOrLga,
  });
  const etaLine = eta ? eta : "We’ll confirm delivery time shortly";

  const subject = (() => {
    switch (params.status) {
      case "order_received":
        return "📦 We've Received Your Order — BelleHairs Owerri";
      case "payment_received":
        return "✅ Payment Confirmed — Your Order is Being Processed!";
      case "order_confirmed":
        return "🎀 Your BelleHairs Order is Confirmed!";
      case "dispatched":
        return "🚚 Your Order is On Its Way — BelleHairs Owerri";
      case "delivered":
        return "💕 Your BelleHairs Order Has Been Delivered!";
      case "cancelled":
        return "❌ Your BelleHairs Order Has Been Cancelled";
    }
  })();

  const introHtml = (() => {
    const name = escapeHtml(params.customerName);
    switch (params.status) {
      case "order_received":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">📦 We&apos;ve Received Your Order</h1>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, thank you for your order! We have received it and are waiting for your payment.
          </p>
        `;
      case "payment_received":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">✅ Payment Confirmed</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, we have confirmed your payment! 🎉
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Your order is now being prepared and will be dispatched soon. We will notify you once your order is on its way!
          </p>
        `;
      case "order_confirmed":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">🎀 Order Confirmed</h1>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, your order has been confirmed and is being carefully packed for you 💕
          </p>
        `;
      case "dispatched":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">🚚 Your Order is On Its Way</h1>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, great news! Your hair is on its way to you 🎉
          </p>
        `;
      case "delivered":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">💕 Delivered</h1>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, your order has been delivered! We hope you absolutely love your new hair 👑
          </p>
        `;
      case "cancelled":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">❌ Order Cancelled</h1>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, your order has been cancelled.
          </p>
        `;
    }
  })();

  const extraHtml = (() => {
    switch (params.status) {
      case "order_received":
        return `
          <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
            <div style="font-weight:900;color:#111;font-size:14px;">Payment instructions</div>
            <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">
              Please make payment via bank transfer and send your proof of payment to <strong>0912 691 4795</strong> on WhatsApp to confirm your order.
              Your order will be processed once payment is confirmed by our team.
            </div>
          </div>
        `;
      case "payment_received":
        return "";
      case "order_confirmed":
        return `
          <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
            <div style="font-weight:900;color:#111;font-size:14px;">Estimated delivery time</div>
            <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">${escapeHtml(etaLine)}</div>
          </div>
        `;
      case "dispatched":
        return `
          <div style="margin-top:14px;background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;">
            <div style="font-weight:900;color:#111;font-size:14px;">Estimated delivery time</div>
            <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">${escapeHtml(etaLine)}</div>
          </div>
          <p style="margin:14px 0 0 0;color:#444;line-height:22px;font-size:14px;">
            If you have any questions, WhatsApp us: <strong>0912 691 4795</strong>
          </p>
        `;
      case "delivered":
        return `
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            We&apos;d love to hear from you — reply to this email or WhatsApp us with your feedback!
          </p>
          <p style="margin:0;color:#444;line-height:22px;font-size:14px;">
            Tag us on TikTok <strong>@bellehairsng</strong> so we can feature you! 💕
          </p>
        `;
      case "cancelled":
        return `
          <p style="margin:0;color:#444;line-height:22px;font-size:14px;">
            If this was a mistake or you have questions, please contact us immediately on WhatsApp: <strong>0912 691 4795</strong>
          </p>
        `;
    }
  })();

  const bodyHtml = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
      ${introHtml}

      <div style="border:1px solid #eee;border-radius:14px;padding:14px;">
        <div style="font-weight:900;color:#111;font-size:14px;margin-bottom:10px;">Order Summary</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding:10px 0;color:#666;font-size:13px;">Delivery fee</td>
            <td align="right" style="padding:10px 0;color:#111;font-weight:900;font-size:13px;">
              ${formatNaira(params.deliveryFee)}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-top:1px solid #eee;color:#111;font-weight:900;font-size:14px;">Total</td>
            <td align="right" style="padding:12px 0;border-top:1px solid #eee;color:${BRAND_PINK};font-weight:900;font-size:16px;">
              ${formatNaira(params.totalAmount)}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top:14px;background:#f7f7fb;border:1px solid #e7e7ff;border-radius:14px;padding:14px;">
        <div style="font-weight:900;color:#111;font-size:14px;">Current status</div>
        <div style="margin-top:6px;color:#444;font-size:14px;line-height:22px;">${escapeHtml(
          statusLabel(params.status),
        )}</div>
      </div>

      ${extraHtml}

      <p style="margin:14px 0 0 0;color:#444;line-height:22px;font-size:14px;">
        Need help? Call/WhatsApp: <strong>0912 691 4795</strong>
      </p>
      <p style="margin:12px 0 0 0;color:#444;line-height:22px;font-size:14px;">
        Thank you for choosing BelleHairs Owerri — A Home of Wigs and Hairs.
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject,
    html: wrapEmail({
      title: subject,
      preheader: `${statusLabel(params.status)} • BelleHairs Owerri`,
      bodyHtml,
      unsubscribeHref: unsubscribeUrl(params.to),
    }),
  });
}

export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  bodyHtml: string;
}) {
  await sendEmail({
    to: params.to,
    subject: params.subject,
    html: wrapEmail({
      title: params.subject,
      bodyHtml: params.bodyHtml,
      unsubscribeHref: unsubscribeUrl(params.to),
    }),
  });
}
