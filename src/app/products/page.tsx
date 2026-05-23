import { Suspense } from "react";

import ProductsClient from "@/app/products/products-client";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-border bg-card p-10 text-white">
            <p className="text-sm text-white/70">Loading products…</p>
          </div>
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
