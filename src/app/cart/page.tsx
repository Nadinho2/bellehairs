"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { selectCartCount, useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const { byId } = useCatalog();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const cartCount = useMemo(() => selectCartCount(items), [items]);
  const lineItems = useMemo(() => {
    return items
      .map((i) => ({ ...i, product: byId[i.productId] }))
      .filter((i) => Boolean(i.product));
  }, [byId, items]);

  const total = useMemo(() => {
    return lineItems.reduce(
      (acc, i) => acc + i.quantity * (i.product?.price ?? 0),
      0,
    );
  }, [lineItems]);

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Browse our premium wigs and hairs and add them to your cart.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Shop now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Cart
          </h1>
          <p className="text-sm text-foreground/70">{cartCount} items</p>
        </div>
        <Link
          href="/products"
          className="hidden rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand sm:inline-flex"
        >
          Continue shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {lineItems.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 text-white sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <p className="text-xs font-semibold text-brand">
                  {item.product?.category}
                </p>
                <p className="mt-1 font-semibold tracking-tight text-white">
                  {item.product?.name}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {formatPrice(item.product?.price ?? 0)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="inline-flex items-center rounded-full border border-border bg-black/40">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full text-white hover:text-brand"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    value={item.quantity}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next)) return;
                      setQuantity(item.productId, next);
                    }}
                    inputMode="numeric"
                    className="w-14 bg-transparent text-center text-sm font-semibold text-white focus:outline-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full text-white hover:text-brand"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-3xl border border-border bg-card p-6 text-white">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Order summary
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm text-white/80">
            <span>Total</span>
            <span className="font-semibold text-white">
              {formatPrice(total)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Checkout on WhatsApp
          </Link>
          <Link
            href="/products"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black hover:border-brand"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
