"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/lib/wishlist";
import type { HairType, Product, ProductCategory } from "@/types/product";

const HAIR_CATEGORIES: ProductCategory[] = ["Wigs", "Weavon", "Bundles", "Closures", "Frontals"];
const CATEGORY_OPTIONS: ProductCategory[] = ["Wigs", "Weavon", "Accessories"];
const ACCESSORY_TYPE_OPTIONS = ["Oils", "Wig Caps", "Glue", "Lace Tint", "Other"] as const;

function isHairProduct(p: Product) {
  return HAIR_CATEGORIES.includes(p.category);
}

function isAccessory(p: Product) {
  return p.category === "Accessories";
}

export default function ProductsClient(props: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wishlist = useWishlist();

  const selectedCategory = (searchParams.get("category") ||
    "All") as ProductCategory | "All";
  const group = (searchParams.get("group") || "").toLowerCase();
  const hairType = (searchParams.get("hairType") || "") as HairType | "";
  const accessoryType = (searchParams.get("accessoryType") || "").trim();
  const wishlistOnly = searchParams.get("wishlist") === "1";
  const bestSellerOnly = searchParams.get("bestSeller") === "1";
  const featuredOnly = searchParams.get("featured") === "1";
  const sort = (searchParams.get("sort") || "").toLowerCase();
  const q = (searchParams.get("q") || "").trim();

  const isAccessoryView = selectedCategory === "Accessories" || group === "accessories";

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

      const hairTypeOk = isAccessory(p) || !hairType || p.hairType === hairType;
      const bestOk = !bestSellerOnly || p.isBestSeller === true;
      const featuredOk = !featuredOnly || p.isFeatured === true;
      const wishOk = !wishlistOnly || wishlist.ids.includes(p.id);

      const accessoryTypeOk =
        !accessoryType || !isAccessory(p) || (p.accessoryType ?? "").toLowerCase() === accessoryType.toLowerCase();

      const queryOk =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.texture ?? "").toLowerCase().includes(query);

      return (
        groupOk &&
        categoryOk &&
        hairTypeOk &&
        accessoryTypeOk &&
        bestOk &&
        featuredOk &&
        wishOk &&
        queryOk
      );
    });
  }, [
    accessoryType,
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

  const sortedList = useMemo(() => {
    const list = filtered.slice();
    if (sort === "newest") {
      return list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return list;
  }, [filtered, sort]);

  const hairProducts = useMemo(() => sortedList.filter(isHairProduct), [sortedList]);
  const accessoryProducts = useMemo(() => sortedList.filter(isAccessory), [sortedList]);
  const showHair = !isAccessoryView;
  const showAccessories = isAccessoryView || selectedCategory === "All";

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Shop
          </h1>
          <p className="text-sm text-foreground/70">
            {isAccessoryView
              ? "Accessories & hair care essentials."
              : "Wigs, weavon, and accessories — premium quality hair."}
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
              if (value === "All") {
                params.delete("category");
                params.delete("hairType");
                params.delete("accessoryType");
              } else {
                params.set("category", value);
                if (value === "Accessories") {
                  params.delete("hairType");
                } else {
                  params.delete("accessoryType");
                }
              }
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

      {isAccessoryView ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("accessoryType", null)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              !accessoryType
                ? "bg-brand text-white"
                : "bg-white text-black border border-black hover:border-brand"
            }`}
          >
            All Accessories
          </button>
          {ACCESSORY_TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setParam("accessoryType", accessoryType === t ? null : t)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                accessoryType === t
                  ? "bg-brand text-white"
                  : "bg-white text-black border border-black hover:border-brand"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      {sortedList.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black bg-black p-8 text-center text-white">
          <p className="text-sm text-white/70">
            No products match your filters.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {showHair && hairProducts.length > 0 ? (
            <div>
              {selectedCategory === "All" && accessoryProducts.length > 0 ? (
                <h2 className="text-lg font-semibold tracking-tight text-foreground mb-5">Hair Products</h2>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hairProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : null}

          {showAccessories && accessoryProducts.length > 0 ? (
            <div>
              {selectedCategory === "All" && hairProducts.length > 0 ? (
                <>
                  <div className="border-t border-black/10 pt-10">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground mb-5">Accessories & Hair Care</h2>
                  </div>
                </>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {accessoryProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
