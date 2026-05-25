"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbHairType, DbProductCategory, DbTexture, ProductRow, SocialFeedRow } from "@/lib/supabase/types";

const LENGTH_OPTIONS = [10, 12, 14, 16, 18, 20, 22, 24, 26] as const;
const CATEGORY_OPTIONS: DbProductCategory[] = ["Wigs", "Weavon", "Accessories"];
const HAIR_TYPE_OPTIONS: DbHairType[] = ["Human Hair", "Vietnamese Hair", "Blend Hair"];
const TEXTURE_OPTIONS: DbTexture[] = [
  "Straight",
  "Bone Straight",
  "Curly",
  "Pixie Curl",
  "Jerry Curl",
  "Burmese Curl",
];
const CLOSURE_OPTIONS = ["2x4", "2x6", "4x4", "5x5", "Full Frontal", "T-Frontal"] as const;

async function uploadPublicImage(params: {
  bucket: string;
  path: string;
  file: File;
}) {
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

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [social, setSocial] = useState<SocialFeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DbProductCategory>("Wigs");
  const [price, setPrice] = useState<string>("");
  const [lengths, setLengths] = useState<number[]>([]);
  const [hairType, setHairType] = useState<DbHairType>("Human Hair");
  const [texture, setTexture] = useState<DbTexture>("Straight");
  const [closureType, setClosureType] = useState<string>("");
  const [accessoryType, setAccessoryType] = useState<string>("");
  const [inStock, setInStock] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const socialBySlot = useMemo(() => {
    const map = new Map<number, SocialFeedRow>();
    for (const row of social) map.set(row.slot_number, row);
    return map;
  }, [social]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, { data: socialData, error: socialError }] = await Promise.all([
        fetch("/api/admin/products", { method: "GET" }),
        supabase.from("social_feed").select("*").order("slot_number", { ascending: true }),
      ]);
      if (socialError) throw socialError;
      const productsJson = (await productsRes.json()) as {
        ok?: boolean;
        rows?: ProductRow[];
        error?: string;
      };
      if (!productsRes.ok || !productsJson.ok) {
        throw new Error(productsJson.error || "Failed to load products.");
      }
      setProducts((productsJson.rows ?? []) as ProductRow[]);
      setSocial((socialData ?? []) as SocialFeedRow[]);
    } catch (e) {
      setError((e as Error).message || "Failed to load admin data.");
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
    setName("");
    setCategory("Wigs");
    setPrice("");
    setLengths([]);
    setHairType("Human Hair");
    setTexture("Straight");
    setClosureType("");
    setAccessoryType("");
    setInStock(true);
    setIsNewArrival(true);
    setIsBestSeller(false);
    setIsFeatured(false);
    setImages([]);
    setDescription("");
    setFormError(null);
  };

  const startEdit = (p: ProductRow) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(String(p.price));
    setLengths(
      (p.lengths ?? [])
        .map((v) => Number(String(v).replace(/[^\d]/g, "")))
        .filter((n) => Number.isFinite(n) && n > 0),
    );
    setHairType((p.hair_type ?? "Human Hair") as DbHairType);
    setTexture((p.texture ?? "Straight") as DbTexture);
    setClosureType(p.closure_type ?? "");
    setAccessoryType(p.accessory_type ?? "");
    setInStock(p.in_stock !== false);
    setIsNewArrival(p.is_new_arrival === true);
    setIsBestSeller(p.is_best_seller === true);
    setIsFeatured(p.is_featured === true);
    setImages(p.images ?? []);
    setDescription(p.description ?? "");
    setFormError(null);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-10 text-white">
          <p className="text-sm text-white/70">Loading admin…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-foreground/70">
            Manage products and homepage social feed.
          </p>
          {error ? <p className="text-sm font-semibold text-brand">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            View shop
          </Link>
          <Link
            href="/admin/banners"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Banners
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Orders
          </Link>
          <Link
            href="/admin/reviews"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Reviews
          </Link>
          <Link
            href="/admin/emails"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Emails
          </Link>
          <Link
            href="/admin/delivery"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Delivery fees
          </Link>
          <button
            type="button"
            onClick={() => onLogout()}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">
              {editingId ? "Edit product" : "Add new product"}
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
                const trimmedName = name.trim();
                if (!trimmedName) throw new Error("Product name is required.");
                const parsedPrice = Number(price);
                if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
                  throw new Error("Enter a valid price.");
                }
                if (images.length === 0) throw new Error("Upload at least one product image.");

                const id = editingId ?? crypto.randomUUID();
                const payload = {
                  id,
                  name: trimmedName,
                  category,
                  hair_type: hairType,
                  texture,
                  closure_type: category === "Weavon" ? (closureType || null) : null,
                  accessory_type: category === "Accessories" ? (accessoryType || null) : null,
                  lengths: lengths.map((n) => `${n}"`),
                  price: parsedPrice,
                  description: description.trim(),
                  images,
                  in_stock: inStock,
                  is_new_arrival: isNewArrival,
                  is_best_seller: isBestSeller,
                  is_featured: isFeatured,
                };

                const res = await fetch("/api/admin/products", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const json = (await res.json()) as { ok?: boolean; error?: string };
                if (!res.ok || !json.ok) throw new Error(json.error || "Failed to save product.");
                if (!editingId) setEditingId(id);
                await loadAll();
              } catch (e2) {
                setFormError((e2 as Error).message || "Failed to save product.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Product Name" value={name} onChange={setName} required />

              <SelectField
                label="Product Category"
                value={category}
                onChange={(v) => setCategory(v as DbProductCategory)}
                required
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>

              <NumberField label="Price (₦)" value={price} onChange={setPrice} required />

              <SelectField
                label="Hair Type"
                value={hairType}
                onChange={(v) => setHairType(v as DbHairType)}
              >
                {HAIR_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Hair Texture"
                value={texture}
                onChange={(v) => setTexture(v as DbTexture)}
              >
                {TEXTURE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Closure Type"
                value={closureType}
                onChange={setClosureType}
                required={false}
              >
                <option value="">None</option>
                {CLOSURE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Accessory Type"
                value={accessoryType}
                onChange={setAccessoryType}
                required={false}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Available Lengths</p>
              <div className="flex flex-wrap gap-2">
                {LENGTH_OPTIONS.map((n) => {
                  const checked = lengths.includes(n);
                  return (
                    <label
                      key={n}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setLengths((prev) => (on ? [...prev, n] : prev.filter((x) => x !== n)));
                        }}
                      />
                      {n}&quot;
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Stock Availability" value={inStock} onToggle={() => setInStock((v) => !v)} onLabel="In Stock" offLabel="Out of Stock" />
              <Toggle label="New Arrival" value={isNewArrival} onToggle={() => setIsNewArrival((v) => !v)} onLabel="Yes" offLabel="No" />
              <Toggle label="Best Seller" value={isBestSeller} onToggle={() => setIsBestSeller((v) => !v)} onLabel="Yes" offLabel="No" />
              <Toggle label="Featured" value={isFeatured} onToggle={() => setIsFeatured((v) => !v)} onLabel="Yes" offLabel="No" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Product Images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  setFormError(null);
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  const id = editingId ?? crypto.randomUUID();
                  if (!editingId) setEditingId(id);
                  try {
                    const urls: string[] = [];
                    for (const file of files) {
                      const safeName = file.name.replaceAll(" ", "-");
                      const path = `${id}/${Date.now()}-${safeName}`;
                      const url = await uploadPublicImage({
                        bucket: "product-images",
                        path,
                        file,
                      });
                      urls.push(url);
                    }
                    setImages((prev) => [...prev, ...urls]);
                    e.target.value = "";
                  } catch (err) {
                    setFormError((err as Error).message || "Failed to upload image.");
                  }
                }}
                className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#C2177A]"
              />

              {images.length ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((src, idx) => (
                    <div
                      key={`${idx}-${src.slice(0, 24)}`}
                      className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                    >
                      <div className="relative aspect-square w-full">
                        <Image src={src} alt={`Product image ${idx + 1}`} fill className="object-cover" unoptimized />
                      </div>
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="w-full border-t border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold text-white hover:text-brand"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <TextAreaField label="Product Description" value={description} onChange={setDescription} required />

            {formError ? <p className="text-sm text-white/80">{formError}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A] disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 text-white">
            <p className="text-sm font-semibold text-white">Products ({products.length})</p>
            <p className="mt-1 text-sm text-white/70">Tap a product to edit or delete it.</p>
          </div>

          <div className="grid gap-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-3xl border border-border bg-card p-5 text-white">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand text-white">
                        B
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand">{p.category}</p>
                    <p className="mt-1 truncate font-semibold text-white">{p.name}</p>
                    <p className="mt-1 text-sm text-white/70">
                      ₦{Number(p.price).toLocaleString("en-NG")}
                      {p.in_stock === false ? " • Out of stock" : ""}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {(p.hair_type ?? "—") + (p.texture ? ` • ${p.texture}` : "")}
                      {p.is_new_arrival ? " • New" : ""}
                      {p.is_best_seller ? " • Best Seller" : ""}
                      {p.is_featured ? " • Featured" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = window.confirm(`Delete "${p.name}"?`);
                      if (!ok) return;
                      const res = await fetch("/api/admin/products", {
                        method: "DELETE",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ id: p.id }),
                      });
                      const json = (await res.json()) as { ok?: boolean; error?: string };
                      if (!res.ok || !json.ok) {
                        window.alert(json.error || "Failed to delete product.");
                        return;
                      }
                      if (editingId === p.id) resetForm();
                      await loadAll();
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Social Feed Images</p>
            <p className="mt-1 text-sm text-white/70">
              Upload 6 images for the homepage social strip.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = window.confirm("Clear all social feed images?");
              if (!ok) return;
              await supabase.from("social_feed").delete().neq("slot_number", 0);
              await loadAll();
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60"
          >
            Clear all
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const slot = idx + 1;
            const row = socialBySlot.get(slot);
            const src = row?.image_url ?? null;
            return (
              <div key={slot} className="overflow-hidden rounded-3xl border border-white/15 bg-black/40">
                <div className="relative aspect-[4/3] w-full">
                  {src ? (
                    <Image src={src} alt={`Social image ${slot}`} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand">
                      <p className="text-3xl leading-none text-white" style={{ fontFamily: "var(--font-logo)" }}>
                        BelleHairs
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
                          const path = `slot-${slot}/${Date.now()}-${file.name.replaceAll(" ", "-")}`;
                          const url = await uploadPublicImage({
                            bucket: "social-feed-images",
                            path,
                            file,
                          });
                          const { error } = await supabase.from("social_feed").upsert(
                            { slot_number: slot, image_url: url },
                            { onConflict: "slot_number" },
                          );
                          if (error) throw new Error(error.message);
                          await loadAll();
                          e.target.value = "";
                        } catch (err) {
                          setError((err as Error).message || "Failed to upload social image.");
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!src}
                    onClick={async () => {
                      await supabase.from("social_feed").delete().eq("slot_number", slot);
                      await loadAll();
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60 disabled:opacity-60"
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

function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function NumberField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <input
        inputMode="numeric"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      >
        {props.children}
      </select>
    </label>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        rows={5}
        className="w-full resize-none rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
      />
    </label>
  );
}

function Toggle(props: {
  label: string;
  value: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-3">
      <p className="text-sm font-semibold text-white">{props.label}</p>
      <button
        type="button"
        onClick={props.onToggle}
        className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
      >
        {props.value ? props.onLabel : props.offLabel}
      </button>
    </div>
  );
}
