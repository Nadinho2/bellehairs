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

export type PaymentReminderCode = "R1" | "R2" | "R3" | "R4" | "R5";

function storeWhatsAppHref(params: { customerName: string; orderId: string; message: string }) {
  const greetingName = params.customerName.trim().split(/\s+/)[0] || params.customerName.trim() || "there";
  const full = `Hi BelleHairs Owerri,\n\n${params.message}\n\nCustomer: ${greetingName}\nOrder ID: ${params.orderId}\n\nI am sending my payment proof now.`;
  return `https://wa.me/2349126914795?text=${encodeURIComponent(full)}`;
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

export async function sendPaymentReminderEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  reminder: PaymentReminderCode;
  items: OrderEmailItem[];
  totalAmount: number;
  deliveryFee: number;
  discountCode?: string;
}) {
  const name = escapeHtml(params.customerName);
  const itemsHtml = orderItemsTable(params.items);

  const baseOrderSummaryHtml = (opts?: { totalOverride?: number; deliveryFeeOverride?: number; showFreeDelivery?: boolean }) => {
    const deliveryFeeShown =
      typeof opts?.deliveryFeeOverride === "number" ? opts.deliveryFeeOverride : params.deliveryFee;
    const totalShown = typeof opts?.totalOverride === "number" ? opts.totalOverride : params.totalAmount;
    const showFree = Boolean(opts?.showFreeDelivery);

    const deliveryFeeCell = showFree
      ? `<span style="text-decoration:line-through;color:#999;">${formatNaira(params.deliveryFee)}</span>
         <span style="margin-left:8px;color:${BRAND_PINK};font-weight:900;">${formatNaira(0)} FREE</span>`
      : `${formatNaira(deliveryFeeShown)}`;

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
  };

  const subject = (() => {
    switch (params.reminder) {
      case "R1":
        return `👀 Hey ${params.customerName}, you forgot something!`;
      case "R2":
        return `⏰ ${params.customerName}, your order expires soon!`;
      case "R3":
        return "💕 We saved your order + a little gift from us";
      case "R4":
        return `🔥 ${params.customerName}, here's 5% off — today only`;
      case "R5":
        return `😢 ${params.customerName}, this is goodbye...`;
    }
  })();

  const cta = (() => {
    switch (params.reminder) {
      case "R1":
        return { label: "Complete My Order", message: "I want to complete my order." };
      case "R2":
        return { label: "Secure My Order Now", message: "I want to secure my order now." };
      case "R3":
        return { label: "Claim Free Delivery", message: "I want to claim the FREE delivery offer for my order." };
      case "R4":
        return {
          label: "Use My 5% Discount",
          message: `I want to use the 5% discount code ${(params.discountCode ?? "BELLE5").trim()} for my order.`,
        };
      case "R5":
        return { label: "Claim My Free Wig Cap", message: "I want to claim the FREE wig cap offer for my order." };
    }
  })();

  const ctaHref = storeWhatsAppHref({
    customerName: params.customerName,
    orderId: params.orderId,
    message: cta.message,
  });

  const introHtml = (() => {
    switch (params.reminder) {
      case "R1":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">👀 Hey ${name}, you forgot something!</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">Hi <strong>${name}</strong>! 💕</p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            We noticed you placed an order with us but haven't completed your payment yet.
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            No worries — your hair is still waiting for you! We're holding your order for the next 24 hours.
          </p>
        `;
      case "R2":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">⏰ ${name}, your order expires soon!</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">Hi <strong>${name}</strong>!</p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            Your order is about to be released back to stock! ⚠️
          </p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            We can only hold your hair for a limited time and other customers are waiting for this exact unit.
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Complete your payment in the next few hours to secure your hair before it's gone!
          </p>
        `;
      case "R3":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">💕 We saved your order + a little gift from us</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>, we really want you to have this hair! 💕
          </p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            If you complete your payment <strong>TODAY</strong>, we will cover your delivery fee completely. That means <strong>FREE delivery</strong> to your door, no matter where you are in Nigeria! 🚚
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            This offer is only available for the next 24 hours. Don't miss it!
          </p>
        `;
      case "R4": {
        const code = (params.discountCode ?? "BELLE5").trim() || "BELLE5";
        const savingsRaw = Math.round((Number(params.totalAmount) || 0) * 0.05);
        const savings = savingsRaw > 0 ? savingsRaw : 0;
        const newTotal = Math.max(0, (Number(params.totalAmount) || 0) - savings);
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">🔥 ${name}, here's 5% off — today only</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            Hi <strong>${name}</strong>! We don't do this often but we really want you to slay in this hair! 👑
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Use the code below for 5% off your order total — but hurry, this expires in 24 hours and won't be available again!
          </p>
          <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px;margin:12px 0 14px 0;">
            <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">DISCOUNT CODE</div>
            <div style="font-size:28px;color:${BRAND_PINK};font-weight:900;letter-spacing:0.08em;margin-top:6px;">${escapeHtml(
              code,
            )}</div>
            <div style="margin-top:10px;font-size:13px;color:#444;line-height:20px;">
              You save: <strong>${formatNaira(savings)}</strong><br />
              New total: <strong style="color:${BRAND_PINK};">${formatNaira(newTotal)}</strong>
            </div>
          </div>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Simply mention this code when you send your payment proof on WhatsApp!
          </p>
        `;
      }
      case "R5":
        return `
          <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">😢 ${name}, this is goodbye...</h1>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">Hi <strong>${name}</strong>...</p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            We're really sad to say this but we are about to cancel your order and release your hair to the next customer. 💔
          </p>
          <p style="margin:0 0 10px 0;color:#444;line-height:22px;font-size:14px;">
            This is your absolute last chance to secure it.
          </p>
          <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
            Pay today and we'll throw in a <strong>FREE wig cap</strong> as our gift to you 🎁 (worth ₦2,500).
            After today, your order will be automatically cancelled and this offer disappears forever.
          </p>
        `;
    }
  })();

  const summaryHtml = (() => {
    if (params.reminder === "R3") {
      const newTotal = Math.max(0, (Number(params.totalAmount) || 0) - (Number(params.deliveryFee) || 0));
      return baseOrderSummaryHtml({ totalOverride: newTotal, deliveryFeeOverride: 0, showFreeDelivery: true });
    }
    if (params.reminder === "R4") {
      const savingsRaw = Math.round((Number(params.totalAmount) || 0) * 0.05);
      const savings = savingsRaw > 0 ? savingsRaw : 0;
      const newTotal = Math.max(0, (Number(params.totalAmount) || 0) - savings);
      return baseOrderSummaryHtml({ totalOverride: newTotal });
    }
    return baseOrderSummaryHtml();
  })();

  const bodyHtml = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
      ${introHtml}
      ${summaryHtml}
      ${paymentInstructionsHtml()}
      <div style="margin-top:14px;">
        ${primaryButton(ctaHref, cta.label)}
      </div>
      <p style="margin:14px 0 0 0;color:#666;line-height:20px;font-size:12px;">
        Order ID: ${escapeHtml(params.orderId)}
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject,
    html: wrapEmail({
      title: subject,
      preheader: `Payment reminder • BelleHairs Owerri`,
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
