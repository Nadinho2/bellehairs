"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BannerSlideRow } from "@/lib/supabase/types";

async function uploadPublicImage(params: { bucket: string; path: string; file: File }) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(params.bucket).upload(params.path, params.file, {
    upsert: true,
    contentType: params.file.type,
    cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}

export default function AdminBannersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [slides, setSlides] = useState<BannerSlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [heading, setHeading] = useState("");
  const [subtext, setSubtext] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [slideOrder, setSlideOrder] = useState<string>("1");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("banner_slides")
        .select("*")
        .order("slide_order", { ascending: true });
      if (e) throw e;
      setSlides((data ?? []) as BannerSlideRow[]);
    } catch (err) {
      setError((err as Error).message || "Failed to load banner slides.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadAll]);

  const resetForm = () => {
    setEditingId(null);
    setHeading("");
    setSubtext("");
    setCtaLabel("");
    setCtaLink("");
    setIsActive(true);
    setSlideOrder("1");
    setImageUrl("");
    setFormError(null);
  };

  const startEdit = (s: BannerSlideRow) => {
    setEditingId(s.id);
    setHeading(s.heading ?? "");
    setSubtext(s.subtext ?? "");
    setCtaLabel(s.cta_label ?? "");
    setCtaLink(s.cta_link ?? "");
    setIsActive(s.is_active !== false);
    setSlideOrder(String(s.slide_order ?? 1));
    setImageUrl(s.image_url ?? "");
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading banners…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Banner Slides</h1>
          <p className="text-sm text-foreground/70">Manage the homepage hero slideshow.</p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Back to admin
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">
              {editingId ? "Edit slide" : "Add new slide"}
            </p>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              setSaving(true);
              try {
                const trimmedHeading = heading.trim();
                if (!trimmedHeading) throw new Error("Heading is required.");
                if (!imageUrl.trim()) throw new Error("Upload a slide image.");
                const orderNum = Number(slideOrder);
                if (!Number.isFinite(orderNum) || orderNum <= 0) throw new Error("Enter a valid order.");

                const id = editingId ?? crypto.randomUUID();
                const payload: BannerSlideRow = {
                  id,
                  heading: trimmedHeading,
                  subtext: subtext.trim() || null,
                  image_url: imageUrl.trim(),
                  cta_label: ctaLabel.trim() || null,
                  cta_link: ctaLink.trim() || null,
                  is_active: isActive,
                  slide_order: orderNum,
                };

                if (editingId) {
                  const { error: e2 } = await supabase.from("banner_slides").update(payload).eq("id", id);
                  if (e2) throw e2;
                } else {
                  const { error: e2 } = await supabase.from("banner_slides").insert(payload);
                  if (e2) throw e2;
                  setEditingId(id);
                }

                await loadAll();
              } catch (err) {
                setFormError((err as Error).message || "Failed to save banner slide.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Heading</span>
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Subtext</span>
              <textarea
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">CTA Label</span>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">CTA Link</span>
                <input
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="/products"
                  className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Slide Order</span>
                <input
                  type="number"
                  min={1}
                  value={slideOrder}
                  onChange={(e) => setSlideOrder(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Active
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Slide Image</p>
              {imageUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <Image src={imageUrl} alt="Banner preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-white/70">
                  Upload an image (recommended: wide landscape).
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  setFormError(null);
                  setSaving(true);
                  try {
                    const id = editingId ?? crypto.randomUUID();
                    if (!editingId) setEditingId(id);
                    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
                    const path = `slides/${id}/${Date.now()}-${safeName}`;
                    const publicUrl = await uploadPublicImage({
                      bucket: "banner-images",
                      path,
                      file,
                    });
                    setImageUrl(publicUrl);
                  } catch (err) {
                    setFormError((err as Error).message || "Failed to upload image.");
                  } finally {
                    setSaving(false);
                    e.currentTarget.value = "";
                  }
                }}
                className="block w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            {formError ? <p className="text-sm font-semibold text-brand">{formError}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create slide"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">Existing slides</p>
          {slides.length === 0 ? (
            <p className="mt-4 text-sm text-white/70">No slides yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {slides.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black sm:w-40">
                    <Image src={s.image_url} alt={s.heading} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{s.heading}</p>
                    <p className="mt-1 text-xs text-white/60">
                      Order: {s.slide_order ?? 0} • {s.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Delete this slide?")) return;
                        const { error: e } = await supabase.from("banner_slides").delete().eq("id", s.id);
                        if (e) {
                          alert(e.message);
                          return;
                        }
                        if (editingId === s.id) resetForm();
                        await loadAll();
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:border hover:border-brand"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
