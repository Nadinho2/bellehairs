"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProductRow, ReviewRow } from "@/lib/supabase/types";

export default function AdminReviewsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState<string>("5");
  const [reviewText, setReviewText] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.name);
    return map;
  }, [products]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: productData, error: pErr }, { data: reviewData, error: rErr }] =
        await Promise.all([
          supabase.from("products").select("id,name").order("created_at", { ascending: false }),
          supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      setProducts((productData ?? []) as ProductRow[]);
      setReviews((reviewData ?? []) as ReviewRow[]);
    } catch (err) {
      setError((err as Error).message || "Failed to load reviews.");
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
    setProductId("");
    setCustomerName("");
    setRating("5");
    setReviewText("");
    setIsVisible(true);
    setFormError(null);
  };

  const startEdit = (r: ReviewRow) => {
    setEditingId(r.id);
    setProductId(r.product_id);
    setCustomerName(r.customer_name ?? "");
    setRating(String(r.rating ?? 5));
    setReviewText(r.review_text ?? "");
    setIsVisible(r.is_visible !== false);
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading reviews…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Reviews</h1>
          <p className="text-sm text-foreground/70">
            Create, approve (visibility), and remove product reviews.
          </p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadAll()}
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

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">
              {editingId ? "Edit review" : "Add review"}
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
                const trimmedName = customerName.trim();
                const trimmedText = reviewText.trim();
                const parsedRating = Number(rating);

                if (!productId) throw new Error("Select a product.");
                if (!trimmedName) throw new Error("Customer name is required.");
                if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                  throw new Error("Rating must be between 1 and 5.");
                }

                const id = editingId ?? crypto.randomUUID();
                const payload = {
                  id,
                  customer_name: trimmedName,
                  product_id: productId,
                  rating: parsedRating,
                  review_text: trimmedText || null,
                  is_visible: isVisible,
                };

                if (editingId) {
                  const { error: e2 } = await supabase.from("reviews").update(payload).eq("id", id);
                  if (e2) throw e2;
                } else {
                  const { error: e2 } = await supabase.from("reviews").insert(payload);
                  if (e2) throw e2;
                  setEditingId(id);
                }

                await loadAll();
              } catch (err) {
                setFormError((err as Error).message || "Failed to save review.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Product</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                required
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Customer name</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Rating (1–5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                  required
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Review text</span>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-28 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-semibold text-white">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Visible on product page
            </label>

            {formError ? <p className="text-sm font-semibold text-brand">{formError}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create review"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <p className="text-sm font-semibold text-white">All reviews</p>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-white/70">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {productNameById.get(r.product_id) ?? r.product_id}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {r.customer_name} • Rating: {r.rating} •{" "}
                        {r.is_visible !== false ? "Visible" : "Hidden"}
                      </p>
                      {r.review_text ? (
                        <p className="mt-3 text-sm leading-7 text-white/75">{r.review_text}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(true);
                          try {
                            const { error: e2 } = await supabase
                              .from("reviews")
                              .update({ is_visible: !(r.is_visible !== false) })
                              .eq("id", r.id);
                            if (e2) throw e2;
                            await loadAll();
                          } catch (err) {
                            alert((err as Error).message || "Failed to update visibility.");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-brand/60"
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Delete this review?")) return;
                          setSaving(true);
                          try {
                            const { error: e2 } = await supabase.from("reviews").delete().eq("id", r.id);
                            if (e2) throw e2;
                            if (editingId === r.id) resetForm();
                            await loadAll();
                          } catch (err) {
                            alert((err as Error).message || "Failed to delete review.");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:border hover:border-brand"
                      >
                        Delete
                      </button>
                    </div>
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
