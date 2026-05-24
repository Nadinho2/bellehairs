"use client";

import { useCartStore } from "@/store/cartStore";

export default function AddToCartButton(props: {
  productId: string;
  variantLengthInches?: number;
  label?: string;
  disabled?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <button
      type="button"
      onClick={() => addItem(props.productId, props.variantLengthInches)}
      disabled={props.disabled}
      className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {props.label ?? "Add to cart"}
    </button>
  );
}
