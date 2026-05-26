"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/format";
import type { ReviewRow } from "@/lib/supabase/types";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";

export default function ProductDetailClient(props: {
  product: Product | null;
  reviews?: ReviewRow[];
}) {
  const product = props.product;
  const reviews = props.reviews ?? [];
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : [product.image].filter(Boolean);
  }, [product]);

  const variants = product?.variants?.length ? product.variants : undefined;
  const [selectedLengthInches, setSelectedLengthInches] = useState<number | null>(
    variants?.[0]?.lengthInches ?? null,
  );
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (!variants || selectedLengthInches === null) return null;
    return variants.find((v) => v.lengthInches === selectedLengthInches) ?? null;
  }, [selectedLengthInches, variants]);

  const detailRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];
    if (product?.hairType) rows.push({ label: "Hair type", value: product.hairType });
    if (product?.texture) rows.push({ label: "Texture", value: product.texture });
    if (product?.closureType) rows.push({ label: "Closure type", value: product.closureType });
    if (product?.accessoryType) rows.push({ label: "Accessory type", value: product.accessoryType });
    const lengths = product?.lengths?.length ? product.lengths : null;
    if (lengths) rows.push({ label: "Available lengths", value: lengths.join(", ") });
    return rows;
  }, [product]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxSrc]);

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Product not found
          </h1>
          <p className="mt-2 text-sm text-white/70">This product may have been removed.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setLightboxSrc(product.image)}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-card text-left"
            aria-label="View product image"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-brand/20 opacity-60" />
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized={product.image.startsWith("data:")}
            />
          </button>

          <div className="grid grid-cols-3 gap-3">
            {images.slice(0, 3).map((src, idx) => (
              <button
                type="button"
                key={`${src}-${idx}`}
                onClick={() => setLightboxSrc(src)}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card text-left"
                aria-label={`View product image ${idx + 1}`}
              >
                <Image
                  src={src}
                  alt={`${product.name} image ${idx + 1}`}
                  fill
                  className="object-cover opacity-90"
                  unoptimized={src.startsWith("data:")}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand">{product.category}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {product.name}
            </h1>
            <p className="text-xl font-semibold text-foreground">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-white">
            {detailRows.length ? (
              <div className="mb-4 grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
                {detailRows.map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-4 text-sm">
                    <p className="text-white/70">{r.label}</p>
                    <p className="text-right font-semibold text-white">{r.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-sm leading-7 text-white/80">{product.description}</p>
          </div>

          {variants ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Select length</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    type="button"
                    key={v.lengthInches}
                    onClick={() => setSelectedLengthInches(v.lengthInches)}
                    className={`inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-semibold text-black transition ${
                      selectedLengthInches === v.lengthInches
                        ? "border-brand"
                        : "border-black hover:border-brand"
                    }`}
                  >
                    {v.lengthInches} in
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 text-white">
                {selectedVariant ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Selected: {selectedVariant.lengthInches} in
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        Price: {formatPrice(selectedVariant.price)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-brand">
                      {formatPrice(selectedVariant.price)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-white/70">
                    Tap a length to preview the price, then add to cart.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedVariant}
                onClick={() => {
                  if (!selectedVariant) return;
                  const id = `${product.id}:${selectedVariant.lengthInches}`;
                  if (!cartItems.some((i) => i.id === id)) addItem(product.id, selectedVariant.lengthInches);
                  router.push("/checkout");
                }}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
              >
                Order on WhatsApp
              </button>
              <AddToCartButton
                productId={product.id}
                variantLengthInches={selectedVariant?.lengthInches}
                disabled={!selectedVariant}
                label={
                  selectedVariant ? `Add ${selectedVariant.lengthInches} in to cart` : "Add to cart"
                }
              />
              <p className="text-xs text-foreground/60">
                Tap “Order on WhatsApp” to continue to checkout and send your order via WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const id = `${product.id}:base`;
                  if (!cartItems.some((i) => i.id === id)) addItem(product.id);
                  router.push("/checkout");
                }}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
              >
                Order on WhatsApp
              </button>
              <AddToCartButton productId={product.id} />
            </div>
          )}
        </div>
      </div>

      {reviews.length ? (
        <div className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Customer Reviews
            </h2>
            <p className="text-sm text-foreground/60">{reviews.length} review(s)</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 6).map((r) => {
              const rating = Math.max(1, Math.min(5, Number(r.rating) || 0));
              const filled = "★★★★★".slice(0, rating);
              const empty = "☆☆☆☆☆".slice(0, 5 - rating);
              return (
                <div
                  key={r.id}
                  className="rounded-3xl border border-border bg-card p-6 text-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {r.customer_name || "Customer"}
                      </p>
                      <p className="mt-1 text-sm text-brand">
                        {filled}
                        <span className="text-white/30">{empty}</span>
                      </p>
                    </div>
                    <p className="text-xs text-white/50">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {r.review_text ? (
                    <p className="mt-4 text-sm leading-7 text-white/75">{r.review_text}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[70vh] w-full sm:h-[78vh]">
              <Image src={lightboxSrc} alt={product.name} fill className="object-contain" unoptimized />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-black/60 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">{product.name}</p>
              <button
                type="button"
                onClick={() => setLightboxSrc(null)}
                className="rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
