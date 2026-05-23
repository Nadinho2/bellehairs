"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";

export default function ProductCard(props: { product: Product }) {
  const { product } = props;
  const addItem = useCartStore((s) => s.addItem);
  const unoptimized = product.image.startsWith("data:");

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card text-white">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-black/40">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/10 to-brand/20 opacity-60" />
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover opacity-95 transition group-hover:scale-[1.02]"
            priority={false}
            unoptimized={unoptimized}
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/70">{product.category}</p>
            <Link
              href={`/products/${product.id}`}
              className="mt-1 block font-semibold tracking-tight text-white hover:text-brand"
            >
              {product.name}
            </Link>
          </div>
          <p className="shrink-0 font-semibold text-white">
            {formatPrice(product.price)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => addItem(product.id)}
          className="w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          aria-label={`Add ${product.name} to cart`}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
