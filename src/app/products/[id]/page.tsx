"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import AddToCartButton from "@/components/AddToCartButton";
import { useCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { byId } = useCatalog();
  const product = byId[params.id];

  const images = useMemo(() => {
    if (!product) return [];
    return product.images?.length ? product.images : [product.image];
  }, [product]);

  const variants = product?.variants?.length ? product.variants : undefined;
  const [selectedLengthInches, setSelectedLengthInches] = useState<number | null>(
    null,
  );

  const selectedVariant = useMemo(() => {
    if (!variants || selectedLengthInches === null) return null;
    return variants.find((v) => v.lengthInches === selectedLengthInches) ?? null;
  }, [selectedLengthInches, variants]);

  const whatsappBaseUrl = "https://wa.me/2349126914795";
  const buildWhatsAppHref = (opts?: { lengthInches?: number; price?: number }) => {
    const lengthLine =
      typeof opts?.lengthInches === "number"
        ? `Length: ${opts.lengthInches} in\n`
        : "";
    const priceLine =
      typeof opts?.price === "number" ? `Price: ${formatPrice(opts.price)}\n` : "";

    const message = `Hello BelleHairs Owerri,\n\nI want to order:\nProduct: ${product?.name ?? ""}\nCategory: ${product?.category ?? ""}\n${lengthLine}${priceLine}\nDelivery location: Owerri (or your city)\n\nMy name is:`;
    return `${whatsappBaseUrl}?text=${encodeURIComponent(message)}`;
  };

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Product not found
          </h1>
          <p className="mt-2 text-sm text-white/70">
            This product may have been removed.
          </p>
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-brand/20 opacity-60" />
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized={product.image.startsWith("data:")}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {images.slice(0, 3).map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Image
                  src={src}
                  alt={`${product.name} image ${idx + 1}`}
                  fill
                  className="object-cover opacity-90"
                  unoptimized={src.startsWith("data:")}
                />
              </div>
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
              {variants ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-white">
            <p className="text-sm leading-7 text-white/80">
              {product.description}
            </p>
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

              <a
                href={buildWhatsAppHref({
                  lengthInches: selectedVariant?.lengthInches,
                  price: selectedVariant?.price,
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
              >
                Order on WhatsApp
              </a>
              <AddToCartButton
                productId={product.id}
                variantLengthInches={selectedVariant?.lengthInches}
                disabled={!selectedVariant}
                label={
                  selectedVariant
                    ? `Add ${selectedVariant.lengthInches} in to cart`
                    : "Add to cart"
                }
              />
              <p className="text-xs text-foreground/60">
                Prefer chat? Tap “Order on WhatsApp” and we’ll confirm availability,
                lengths, and delivery.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <a
                href={buildWhatsAppHref({ price: product.price })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
              >
                Order on WhatsApp
              </a>
              <AddToCartButton productId={product.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
