"use client";

import { useCartStore } from "@/store/cartStore";

export default function AddToCartButton(props: { productId: string }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <button
      type="button"
      onClick={() => addItem(props.productId)}
      className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
    >
      Add to cart
    </button>
  );
}
