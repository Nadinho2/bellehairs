"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { setCookie } from "@/lib/cookies";
import { readSubscriberEmail, writeSubscriberEmail } from "@/lib/emails";
import {
  defaultDeliveryFeeConfig,
  getDeliveryQuote,
  loadDeliveryFeeConfigFromStorage,
  type DeliveryFeeConfig,
  type DeliveryMethod,
} from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { fetchProductsByIds } from "@/lib/supabase/browser-queries";
import { mapProductRowToProduct } from "@/lib/supabase/mappers";
import { useCartStore } from "@/store/cartStore";
import type { OrderRowInsert } from "@/lib/supabase/types";
import type { Product } from "@/types/product";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

function normalizeNigerianPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return null;
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [byId, setById] = useState<Record<string, Product>>({});

  const [deliveryFeeConfig] = useState<DeliveryFeeConfig>(() => {
    if (typeof window === "undefined") return defaultDeliveryFeeConfig;
    return loadDeliveryFeeConfigFromStorage();
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => readSubscriberEmail() ?? "");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [state, setState] = useState<(typeof NIGERIAN_STATES)[number] | "">("");
  const [cityOrLga, setCityOrLga] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    "HOME_DELIVERY",
  );
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.productId)));
    if (ids.length === 0) {
      const t = window.setTimeout(() => setById({}), 0);
      return () => window.clearTimeout(t);
    }
    fetchProductsByIds(ids)
      .then((rows) => rows.map(mapProductRowToProduct))
      .then((products) => {
        const map: Record<string, Product> = {};
        for (const p of products) map[p.id] = p;
        setById(map);
      })
      .catch(() => setById({}));
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      const product = byId[item.productId];
      const unit =
        item.variantLengthInches && product?.variants?.length
          ? product.variants.find((v) => v.lengthInches === item.variantLengthInches)
              ?.price ?? product.price
          : product?.price ?? 0;
      return acc + item.quantity * unit;
    }, 0);
  }, [byId, items]);

  const isPickup = deliveryMethod === "PICKUP_OWERRI";

  const deliveryQuote = useMemo(() => {
    return getDeliveryQuote({
      config: deliveryFeeConfig,
      deliveryMethod,
      state,
      cityOrLga,
    });
  }, [cityOrLga, deliveryFeeConfig, deliveryMethod, state]);

  const deliveryFee =
    deliveryQuote.kind === "delivery" || deliveryQuote.kind === "pickup"
      ? deliveryQuote.fee
      : 0;

  const grandTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Your cart is empty.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const orderLines = items
    .map((item) => {
      const product = byId[item.productId];
      const name = product?.name ?? item.productId;
      const unit =
        item.variantLengthInches && product?.variants?.length
          ? product.variants.find((v) => v.lengthInches === item.variantLengthInches)
              ?.price ?? product.price
          : product?.price ?? 0;
      const lineTotal = unit * item.quantity;
      const lengthLabel = item.variantLengthInches
        ? ` • ${item.variantLengthInches} in`
        : "";
      return `- ${name}${lengthLabel} (Qty ${item.quantity}) — ${formatPrice(
        lineTotal,
      )}`;
    })
    .join("\n");

  const phonePrimaryNormalized = normalizeNigerianPhone(phonePrimary);
  const phoneSecondaryNormalized = normalizeNigerianPhone(phoneSecondary);

  const canComplete =
    fullName.trim().length > 1 &&
    email.trim().length > 3 &&
    Boolean(phonePrimaryNormalized) &&
    (isPickup ||
      (deliveryAddress.trim().length > 5 &&
        state !== "" &&
        cityOrLga.trim().length > 1));

  const storeWhatsAppHref = (() => {
    const primary = phonePrimaryNormalized ? `0${phonePrimaryNormalized.slice(3)}` : phonePrimary.trim();
    const secondary =
      phoneSecondaryNormalized ? `0${phoneSecondaryNormalized.slice(3)}` : phoneSecondary.trim();

    const deliverySection = isPickup
      ? `Preferred delivery method: Pickup in Owerri\n`
      : `Preferred delivery method: Home Delivery\nDelivery address: ${deliveryAddress.trim()}\nState: ${state}\nCity/LGA: ${cityOrLga.trim()}\n`;

    const deliveryFeeLine =
      deliveryQuote.kind === "pickup"
        ? `Delivery: ${deliveryQuote.label}\nDelivery fee: ${formatPrice(0)}\n`
        : deliveryQuote.kind === "delivery"
          ? `Delivery: ${deliveryQuote.zone} • ${deliveryQuote.durationLabel}\nDelivery fee: ${formatPrice(deliveryQuote.fee)}\n`
          : `Delivery: Pending\nDelivery fee: ${formatPrice(0)}\n`;

    const note = orderNote.trim()
      ? `Order note: ${orderNote.trim()}\n`
      : "";

    const customerPhonesLine = secondary
      ? `Phone: ${primary} / ${secondary}\n`
      : `Phone: ${primary}\n`;

    const message = `Hello BelleHairs Owerri,\n\nI want to place an order.\n\nCustomer details:\nName: ${fullName.trim()}\nEmail: ${email.trim()}\n${customerPhonesLine}${deliverySection}${deliveryFeeLine}${note}\nOrder summary:\n${orderLines}\n\nSubtotal: ${formatPrice(total)}\nDelivery fee: ${formatPrice(deliveryFee)}\nTotal: ${formatPrice(grandTotal)}`;

    return `https://wa.me/2349126914795?text=${encodeURIComponent(message)}`;
  })();

  const customerConfirmHref = (() => {
    if (!phonePrimaryNormalized) return null;
    const firstName = fullName.trim().split(/\s+/)[0] || "there";
    const message = `Hi ${firstName}, BelleHairs Owerri here.\n\nWe’ve received your order request on WhatsApp. We’ll confirm availability, total cost, and delivery details shortly.\n\nThank you for choosing BelleHairs Owerri — A Home of Wigs and Hairs.`;
    return `https://wa.me/${phonePrimaryNormalized}?text=${encodeURIComponent(message)}`;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full lg:flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Fill in your details, then complete your order via WhatsApp.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canComplete) return;
              setCookie("bh_email_subscribed", "1", 365);
              writeSubscriberEmail(email.trim().toLowerCase());

              const orderItems = items.map((item) => {
                const product = byId[item.productId];
                return {
                  product_id: item.productId,
                  name: product?.name ?? item.productId,
                  quantity: item.quantity,
                  length_in: item.variantLengthInches ?? null,
                  unit_price:
                    item.variantLengthInches && product?.variants?.length
                      ? product.variants.find(
                          (v) => v.lengthInches === item.variantLengthInches,
                        )?.price ?? product.price
                      : product?.price ?? 0,
                };
              });

              const orderPayload: OrderRowInsert = {
                customer_name: fullName.trim(),
                customer_email: email.trim().toLowerCase(),
                customer_phone: phonePrimary.trim(),
                customer_phone_2: phoneSecondary.trim() || null,
                delivery_address: isPickup ? null : deliveryAddress.trim(),
                state: isPickup ? null : state || null,
                city: isPickup ? null : cityOrLga.trim() || null,
                delivery_method: deliveryMethod,
                delivery_fee: deliveryFee,
                order_note: orderNote.trim() || null,
                items: orderItems,
                total_amount: grandTotal,
                status: "pending",
              };

              const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(orderPayload),
              });
              const json = (await res.json()) as { ok?: boolean; error?: string };
              if (!res.ok || !json.ok) {
                alert(json.error || "Failed to place order. Please try again.");
                return;
              }

              window.open(storeWhatsAppHref, "_blank", "noopener,noreferrer");
              if (customerConfirmHref) {
                window.open(customerConfirmHref, "_blank", "noopener,noreferrer");
              }
              clearCart();
            }}
          >
            <div className="rounded-3xl border border-border bg-card p-6 text-white">
              <p className="text-sm font-semibold text-white">Customer details</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="e.g. Adaeze Okafor"
                  required
                />
                <Field
                  label="Email (for order confirmation)"
                  value={email}
                  onChange={setEmail}
                  placeholder="e.g. you@example.com"
                  required
                  type="email"
                />
                <Field
                  label="Phone Number"
                  value={phonePrimary}
                  onChange={setPhonePrimary}
                  placeholder="e.g. 0912 691 4795"
                  required
                  type="tel"
                />
                <Field
                  label="Second Phone Number (Optional)"
                  value={phoneSecondary}
                  onChange={setPhoneSecondary}
                  placeholder="e.g. 0803 000 0000"
                  type="tel"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 text-white">
              <p className="text-sm font-semibold text-white">Delivery</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Preferred Delivery Method"
                  value={deliveryMethod}
                  onChange={(v) =>
                    setDeliveryMethod(v as DeliveryMethod)
                  }
                  required
                >
                  <option value="HOME_DELIVERY">Home Delivery</option>
                  <option value="PICKUP_OWERRI">Pickup in Owerri</option>
                </Select>

                <Select
                  label="State"
                  value={state}
                  onChange={(v) => setState(v as (typeof NIGERIAN_STATES)[number] | "")}
                  required={!isPickup}
                  disabled={isPickup}
                >
                  <option value="">Select a state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>

                <div className="sm:col-span-2 rounded-2xl border border-white/15 bg-black/40 p-4">
                  {deliveryQuote.kind === "pickup" ? (
                    <p className="text-sm text-white/80">{deliveryQuote.label}</p>
                  ) : deliveryQuote.kind === "incomplete" ? (
                    <p className="text-sm text-white/70">{deliveryQuote.reason}</p>
                  ) : (
                    <p className="text-sm text-white/80">
                      Delivery: {formatPrice(deliveryQuote.fee)} •{" "}
                      {deliveryQuote.durationLabel}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-white/60">
                    Manage delivery fees in{" "}
                    <Link href="/admin/delivery" className="text-brand hover:underline">
                      Admin → Delivery
                    </Link>
                    .
                  </p>
                </div>

                <Field
                  label="City / LGA"
                  value={cityOrLga}
                  onChange={setCityOrLga}
                  placeholder="e.g. Owerri Municipal"
                  required={!isPickup}
                  disabled={isPickup}
                />

                <Textarea
                  label="Delivery Address (Full Address)"
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  placeholder="House number, street, closest landmark"
                  required={!isPickup}
                  disabled={isPickup}
                />
              </div>

              {isPickup ? (
                <p className="mt-3 text-sm text-white/70">
                  Pickup orders will be arranged in Owerri after confirmation.
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 text-white">
              <p className="text-sm font-semibold text-white">
                Order note (Optional)
              </p>
              <div className="mt-4">
                <Textarea
                  label="Special Instructions"
                  value={orderNote}
                  onChange={setOrderNote}
                  placeholder="Any preference for delivery time, wig customization, etc."
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!canComplete}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Complete Order via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => clearCart()}
                className="inline-flex w-full items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black hover:border-brand"
              >
                Clear cart
              </button>
            </div>

            <p className="text-xs text-foreground/60">
              The button opens WhatsApp to BelleHairs (0912 691 4795) with your order
              details pre-filled, then opens a confirmation message to your own
              WhatsApp number.
            </p>
          </form>
        </div>

        <div className="w-full lg:w-[360px]">
          <div className="rounded-3xl border border-border bg-card p-6 text-white">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Summary
            </h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const product = byId[item.productId];
                const unit =
                  item.variantLengthInches && product?.variants?.length
                    ? product.variants.find(
                        (v) => v.lengthInches === item.variantLengthInches,
                      )?.price ?? product.price
                    : product?.price ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {product?.name ?? item.productId}
                      </p>
                      <p className="text-white/70">
                        Qty {item.quantity}
                        {item.variantLengthInches ? ` • ${item.variantLengthInches} in` : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-white">
                      {formatPrice(unit * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Subtotal</span>
                <span className="font-semibold text-white">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Delivery</span>
                <span className="font-semibold text-white">
                  {deliveryQuote.kind === "pickup" ? formatPrice(0) : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-white">Total</span>
                <span className="text-base font-semibold text-white">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
      />
    </label>
  );
}

function Textarea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2 sm:col-span-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        rows={3}
        className="w-full resize-none rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
      />
    </label>
  );
}

function Select(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        disabled={props.disabled}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
      >
        {props.children}
      </select>
    </label>
  );
}
