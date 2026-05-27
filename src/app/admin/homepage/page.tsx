"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { HomepageCategoryCardRow } from "@/lib/supabase/types";

const CATEGORIES = ["Wigs", "Weavon", "Accessories"] as const;

async function uploadPublicImage(params: {
  bucket: string;
  path: string;
  file: File;
}): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.file, { upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}

export default function AdminHomepagePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [categoryCards, setCategoryCards] = useState<HomepageCategoryCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const categoryCardByCategory = useMemo(() => {
    const map = new Map<string, HomepageCategoryCardRow>();
    for (const row of categoryCards) map.set(row.category, row);
    return map;
  }, [categoryCards]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("homepage_category_cards")
        .select("*")
        .order("category", { ascending: true });
      if (fetchError) throw fetchError;
      setCategoryCards((data ?? []) as HomepageCategoryCardRow[]);
    } catch (err) {
      setCategoryCards([]);
      setError((err as Error).message || "Failed to load category images.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

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
            Manage the "Shop by Category" section images on the homepage.
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

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Shop by Category Images</p>
            <p className="mt-1 text-sm text-white/70">
              These images show in the "Shop by Category" section on the homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = window.confirm("Clear all homepage category images?");
              if (!ok) return;
              setError(null);
              try {
                const { error: deleteError } = await supabase
                  .from("homepage_category_cards")
                  .delete()
                  .neq("category", "");
                if (deleteError) throw new Error(deleteError.message);
                await refresh();
              } catch (err) {
                setError((err as Error).message || "Failed to clear category images.");
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60"
          >
            Clear all
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const row = categoryCardByCategory.get(cat) ?? null;
            const src = row?.image_url ?? null;
            return (
              <div key={cat} className="overflow-hidden rounded-3xl border border-white/15 bg-black/40">
                <div className="relative aspect-[4/3] w-full">
                  {src ? (
                    <Image src={src} alt={`${cat} category image`} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand">
                      <p className="text-3xl leading-none text-white" style={{ fontFamily: "var(--font-logo)" }}>
                        {cat}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        setError(null);
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const safeName = file.name.replaceAll(" ", "-");
                          const path = `category-cards/${cat}/${Date.now()}-${safeName}`;
                          const url = await uploadPublicImage({
                            bucket: "banner-images",
                            path,
                            file,
                          });
                          const { error: upsertError } = await supabase.from("homepage_category_cards").upsert(
                            { category: cat, image_url: url },
                            { onConflict: "category" },
                          );
                          if (upsertError) throw new Error(upsertError.message);
                          await refresh();
                          e.target.value = "";
                        } catch (err) {
                          setError((err as Error).message || "Failed to upload category image.");
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      try {
                        const existing = categoryCardByCategory.get(cat);
                        if (existing?.image_url) {
                          const prefix = "/object/public/";
                          const idx = existing.image_url.indexOf(prefix);
                          if (idx !== -1) {
                            const afterPrefix = existing.image_url.slice(idx + prefix.length);
                            const slashIdx = afterPrefix.indexOf("/");
                            if (slashIdx !== -1) {
                              const bucketName = afterPrefix.slice(0, slashIdx);
                              const objectPath = afterPrefix.slice(slashIdx + 1);
                              await supabase.storage.from(bucketName).remove([objectPath]);
                            }
                          }
                        }
                        const { error: deleteError } = await supabase
                          .from("homepage_category_cards")
                          .delete()
                          .eq("category", cat);
                        if (deleteError) throw new Error(deleteError.message);
                        await refresh();
                      } catch (err) {
                        setError((err as Error).message || "Failed to remove category image.");
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
