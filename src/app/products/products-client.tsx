"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/lib/wishlist";
import type { HairType, Product, ProductCategory } from "@/types/product";

const CATEGORY_OPTIONS: ProductCategory[] = ["Wigs", "Weavon", "Accessories"];

export default function ProductsClient(props: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wishlist = useWishlist();

  const selectedCategory = (searchParams.get("category") ||
    "All") as ProductCategory | "All";
  const group = (searchParams.get("group") || "").toLowerCase();
  const hairType = (searchParams.get("hairType") || "") as HairType | "";
  const wishlistOnly = searchParams.get("wishlist") === "1";
  const bestSellerOnly = searchParams.get("bestSeller") === "1";
  const featuredOnly = searchParams.get("featured") === "1";
  const sort = (searchParams.get("sort") || "").toLowerCase();
  const q = (searchParams.get("q") || "").trim();

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return props.products.filter((p) => {
      const groupOk =
        !group ||
        (group === "wigs"
          ? p.category === "Wigs"
          : group === "weavon"
            ? p.category === "Weavon"
            : group === "accessories"
              ? p.category === "Accessories"
              : true);

      const categoryOk =
        selectedCategory === "All" || p.category === selectedCategory;

      const hairTypeOk = !hairType || p.hairType === hairType;
      const bestOk = !bestSellerOnly || p.isBestSeller === true;
      const featuredOk = !featuredOnly || p.isFeatured === true;
      const wishOk = !wishlistOnly || wishlist.ids.includes(p.id);

      const queryOk =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.texture ?? "").toLowerCase().includes(query);

      return (
        groupOk &&
        categoryOk &&
        hairTypeOk &&
        bestOk &&
        featuredOk &&
        wishOk &&
        queryOk
      );
    });
  }, [
    bestSellerOnly,
    featuredOnly,
    group,
    hairType,
    props.products,
    q,
    selectedCategory,
    wishlistOnly,
    wishlist.ids,
  ]);

  const finalList = useMemo(() => {
    const list = filtered.slice();
    if (sort === "newest") {
      return list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return list;
  }, [filtered, sort]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Shop
          </h1>
          <p className="text-sm text-foreground/70">
            Wigs, weavon, and accessories — premium quality hair.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-black bg-black px-3 py-2 text-sm text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-white/70"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const next = (e.target as HTMLInputElement).value;
                const params = new URLSearchParams(searchParams.toString());
                if (next.trim()) params.set("q", next.trim());
                else params.delete("q");
                router.push(`/products?${params.toString()}`);
              }}
              placeholder="Search (e.g. bone straight)..."
              className="w-64 max-w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
              aria-label="Search products"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              const value = e.target.value;
              const params = new URLSearchParams(searchParams.toString());
              if (value === "All") params.delete("category");
              else params.set("category", value);
              router.push(`/products?${params.toString()}`);
            }}
            className="h-10 rounded-full border border-black bg-black px-4 text-sm text-white focus:outline-none"
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        {finalList.length === 0 ? (
          <div className="rounded-2xl border border-black bg-black p-8 text-center text-white">
            <p className="text-sm text-white/70">
              No products match your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {finalList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
