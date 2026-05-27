"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { HomepageHeroGridRow, ProductRow } from "@/lib/supabase/types";

type SlotKey = "slot_1" | "slot_2" | "slot_3" | "slot_4" | "slot_5";

const SLOTS: Array<{ slot: SlotKey; label: string }> = [
  { slot: "slot_1", label: "Best Seller (Tall Left)" },
  { slot: "slot_2", label: "Vietnamese Hair (Top Middle)" },
  { slot: "slot_3", label: "New Arrival (Top Right)" },
  { slot: "slot_4", label: "Human Hair (Bottom Wide)" },
  { slot: "slot_5", label: "Accessories" },
];

function safeFirstImage(p: ProductRow) {
  const images = Array.isArray(p.images) ? p.images : null;
  if (images?.[0]) return images[0];
  const fallback = (p as unknown as { image?: string | null }).image ?? null;
  return fallback ?? null;
}

export default function AdminHomepagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [gridRows, setGridRows] = useState<HomepageHeroGridRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlot, setSavingSlot] = useState<SlotKey | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, gRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("homepage_hero_grid").select("*"),
      ]);
      if (pRes.error) throw pRes.error;
      if (gRes.error) throw gRes.error;
      setProducts((pRes.data ?? []) as ProductRow[]);
      setGridRows((gRes.data ?? []) as HomepageHeroGridRow[]);
    } catch (err) {
      setProducts([]);
      setGridRows([]);
      setError((err as Error).message || "Failed to load homepage settings.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const gridBySlot = useMemo(() => {
    const map = new Map<string, HomepageHeroGridRow>();
    for (const r of gridRows) map.set(String(r.slot), r);
    return map;
  }, [gridRows]);

  const productById = useMemo(() => {
    return new Map(products.map((p) => [p.id, p] as const));
  }, [products]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading homepage settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Homepage</h1>
          <p className="text-sm text-foreground/70">
            Choose which products appear in the 5 hero grid slots.
          </p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
          {savedMessage ? <p className="text-sm font-semibold text-white">{savedMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Refresh
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Hero grid slots</p>
          <p className="mt-1 text-xs text-white/60">
            Changes reflect on the homepage immediately.
          </p>

          <div className="mt-5 space-y-4">
            {SLOTS.map((s) => {
              const current = gridBySlot.get(s.slot);
              const selectedId = (current?.product_id ?? "") as string;
              const selectedProduct = selectedId ? productById.get(selectedId) ?? null : null;
              const previewImage = selectedProduct ? safeFirstImage(selectedProduct) : null;
              return (
                <div key={s.slot} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/60">{s.slot.toUpperCase()}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{s.label}</p>
                      {selectedProduct ? (
                        <p className="mt-1 text-xs text-white/60">
                          {selectedProduct.name} • {formatPrice(Number(selectedProduct.price ?? 0))}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-white/60">No product selected.</p>
                      )}
                    </div>
                    <select
                      value={selectedId}
                      disabled={savingSlot === s.slot}
                      onChange={async (e) => {
                        const nextId = e.target.value || null;
                        setSavingSlot(s.slot);
                        setSavedMessage(null);
                        setError(null);
                        try {
                          const payload: HomepageHeroGridRow = {
                            slot: s.slot,
                            product_id: nextId,
                            updated_at: new Date().toISOString(),
                          };
                          const { error: upsertError, data } = await supabase
                            .from("homepage_hero_grid")
                            .upsert(payload, { onConflict: "slot" })
                            .select("*");
                          if (upsertError) throw upsertError;
                          setGridRows((data ?? []) as HomepageHeroGridRow[]);
                          setSavedMessage("Saved.");
                          window.setTimeout(() => setSavedMessage(null), 1500);
                        } catch (err) {
                          setError((err as Error).message || "Failed to save homepage hero grid.");
                        } finally {
                          setSavingSlot(null);
                        }
                      }}
                      className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60 sm:max-w-sm"
                      aria-label={`Select product for ${s.slot}`}
                    >
                      <option value="">— Select product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    {previewImage ? (
                      <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-black">
                        <Image
                          src={previewImage}
                          alt={selectedProduct?.name ?? "Preview"}
                          fill
                          className="object-cover"
                          unoptimized={previewImage.startsWith("data:")}
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-white/60">
                        Preview will appear here.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Links</p>
          <div className="mt-4 space-y-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
            >
              View homepage
            </Link>
            <Link
              href="/admin/email-templates"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-black px-6 py-3 text-sm font-semibold text-white hover:border-brand/60"
            >
              Email Templates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

