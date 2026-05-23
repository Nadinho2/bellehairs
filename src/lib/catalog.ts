"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { products as baseProducts } from "@/data/products";
import type {
  HairType,
  Product,
  ProductCategory,
  ProductVariant,
} from "@/types/product";

export const PRODUCTS_STORAGE_KEY = "bellehairs.products.v1";
export const PRODUCTS_UPDATED_EVENT = "bellehairs.products.updated";

type StoredPayload = {
  version: 1;
  products: Product[];
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Wigs",
  "Bundles",
  "Closures",
  "Frontals",
  "Accessories",
];

export const LENGTH_OPTIONS = [10, 12, 14, 16, 18, 20, 22, 24, 26] as const;
export const TEXTURE_OPTIONS = ["Straight", "Curly", "Wavy", "Kinky"] as const;
export const HAIR_TYPE_OPTIONS: HairType[] = [
  "Human Hair",
  "Vietnamese Hair",
  "Blend Hair",
];

function safeParseProducts(raw: string | null): Product[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPayload;
    if (parsed?.version !== 1) return null;
    if (!Array.isArray(parsed.products)) return null;
    const now = Date.now();
    return parsed.products.map((p) => {
      const createdAt = typeof p.createdAt === "number" ? p.createdAt : now;
      const updatedAt = typeof p.updatedAt === "number" ? p.updatedAt : createdAt;
      return {
        ...p,
        createdAt,
        updatedAt,
        inStock: p.inStock !== false,
      };
    });
  } catch {
    return null;
  }
}

export function loadCatalogFromStorage(): Product[] | null {
  const products = safeParseProducts(localStorage.getItem(PRODUCTS_STORAGE_KEY));
  return products;
}

export function saveCatalogToStorage(products: Product[]) {
  const payload: StoredPayload = { version: 1, products };
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
}

export function ensureCatalogInitialized() {
  const existing = loadCatalogFromStorage();
  if (existing?.length) return;
  saveCatalogToStorage(baseProducts);
}

export function makeIdFromName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto.randomUUID as () => string)().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `bh-${base || "product"}-${suffix}`;
}

export function buildVariantsFromLengths(lengths: number[], price: number): ProductVariant[] {
  const unique = Array.from(new Set(lengths)).filter((n) => Number.isFinite(n));
  return unique
    .sort((a, b) => a - b)
    .map((lengthInches) => ({ lengthInches, price }));
}

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === "undefined") return baseProducts;
    ensureCatalogInitialized();
    const stored = loadCatalogFromStorage();
    return stored?.length ? stored : baseProducts;
  });

  const refresh = useCallback(() => {
    const stored = loadCatalogFromStorage();
    setProducts(stored?.length ? stored : baseProducts);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PRODUCTS_STORAGE_KEY) return;
      refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  const byId = useMemo(() => {
    return products.reduce<Record<string, Product>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [products]);

  return { products, byId, setProducts, refresh };
}
