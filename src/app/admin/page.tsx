"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { useAdminAuth } from "@/lib/admin-auth";
import {
  buildVariantsFromLengths,
  HAIR_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  makeIdFromName,
  PRODUCT_CATEGORIES,
  saveCatalogToStorage,
  TEXTURE_OPTIONS,
  useCatalog,
} from "@/lib/catalog";
import { useSocialFeed } from "@/lib/socialFeed";
import type { HairType, Product, ProductCategory } from "@/types/product";

export default function AdminPage() {
  const auth = useAdminAuth();
  const catalog = useCatalog();
  const socialFeed = useSocialFeed();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Wigs");
  const [price, setPrice] = useState<string>("");
  const [lengths, setLengths] = useState<number[]>([]);
  const [hairType, setHairType] = useState<HairType>(HAIR_TYPE_OPTIONS[0]);
  const [texture, setTexture] = useState<string>(TEXTURE_OPTIONS[0]);
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sortedProducts = useMemo(() => {
    return [...catalog.products].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog.products]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("Wigs");
    setPrice("");
    setLengths([]);
    setHairType(HAIR_TYPE_OPTIONS[0]);
    setTexture(TEXTURE_OPTIONS[0]);
    setInStock(true);
    setIsBestSeller(false);
    setIsFeatured(false);
    setImages([]);
    setDescription("");
    setFormError(null);
    setSaved(false);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(String(p.price));
    setLengths(
      p.variants?.length
        ? p.variants.map((v) => v.lengthInches)
        : LENGTH_OPTIONS.slice(0, 1).map((n) => n),
    );
    setHairType(p.hairType ?? HAIR_TYPE_OPTIONS[0]);
    setTexture(p.texture ?? TEXTURE_OPTIONS[0]);
    setInStock(p.inStock !== false);
    setIsBestSeller(p.isBestSeller === true);
    setIsFeatured(p.isFeatured === true);
    setImages(p.images?.length ? p.images : [p.image].filter(Boolean));
    setDescription(p.description ?? "");
    setFormError(null);
    setSaved(false);
  };

  if (!auth.isAuthed) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-8 text-white">
          <p className="text-xs font-semibold text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Login
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Enter your admin username and password.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const result = auth.login(loginUsername, loginPassword);
              if (!result.ok) {
                setLoginError(result.message);
                return;
              }
              setLoginError(null);
              setLoginUsername("");
              setLoginPassword("");
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Username</span>
              <input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                autoComplete="username"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Password</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-brand/40"
                autoComplete="current-password"
                required
              />
            </label>

            {loginError ? (
              <p className="text-sm text-white/80">{loginError}</p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
            >
              Login
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black hover:border-brand"
            >
              Back to site
            </Link>
          </form>
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
            Product Upload
          </h1>
          <p className="text-sm text-foreground/70">
            Add, edit, or delete products. Changes reflect immediately on the Shop
            page.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            View shop
          </Link>
          <Link
            href="/admin/emails"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Email list
          </Link>
          <Link
            href="/admin/delivery"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2 text-sm font-semibold text-black hover:border-brand"
          >
            Delivery fees
          </Link>
          <button
            type="button"
            onClick={() => {
              auth.logout();
              resetForm();
            }}
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
            onSubmit={(e) => {
              e.preventDefault();
              setFormError(null);
              setSaved(false);

              const trimmedName = name.trim();
              if (!trimmedName) {
                setFormError("Product name is required.");
                return;
              }

              const parsedPrice = Number(price);
              if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
                setFormError("Enter a valid price.");
                return;
              }

              if (!images.length) {
                setFormError("Please upload at least one product image.");
                return;
              }

              const selectedLengths = lengths.length ? lengths : [];
              const variants = selectedLengths.length
                ? buildVariantsFromLengths(selectedLengths, parsedPrice)
                : undefined;

              const nextId = editingId ?? makeIdFromName(trimmedName);
              const now = Date.now();
              const prev = catalog.products.find((p) => p.id === nextId);
              const createdAt =
                typeof prev?.createdAt === "number" ? prev.createdAt : now;

              const nextProduct: Product = {
                id: nextId,
                name: trimmedName,
                category,
                price: parsedPrice,
                variants,
                hairType,
                texture: texture || undefined,
                inStock,
                isBestSeller,
                isFeatured,
                createdAt,
                updatedAt: now,
                description: description.trim(),
                image: images[0],
                images,
              };

              const nextProducts = (() => {
                const existing = catalog.products;
                const idx = existing.findIndex((p) => p.id === nextId);
                if (idx === -1) return [nextProduct, ...existing];
                const copy = [...existing];
                copy[idx] = nextProduct;
                return copy;
              })();

              saveCatalogToStorage(nextProducts);
              setSaved(true);
              setEditingId(nextId);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Product Name"
                value={name}
                onChange={setName}
                required
              />
              <SelectField
                label="Product Category"
                value={category}
                onChange={(v) => setCategory(v as ProductCategory)}
                required
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>

              <NumberField
                label="Price (₦)"
                value={price}
                onChange={setPrice}
                required
              />

              <SelectField label="Hair Type" value={hairType} onChange={(v) => setHairType(v as HairType)}>
                {HAIR_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Hair Texture"
                value={texture}
                onChange={setTexture}
              >
                {TEXTURE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>
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
                          setLengths((prev) =>
                            on ? [...prev, n] : prev.filter((x) => x !== n),
                          );
                        }}
                      />
                      {n} in
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-white/60">
                If no lengths are selected, the product will be added without length
                options.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-3">
              <p className="text-sm font-semibold text-white">Stock Availability</p>
              <button
                type="button"
                onClick={() => setInStock((v) => !v)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-3">
                <p className="text-sm font-semibold text-white">Best Seller</p>
                <button
                  type="button"
                  onClick={() => setIsBestSeller((v) => !v)}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
                >
                  {isBestSeller ? "Yes" : "No"}
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-3">
                <p className="text-sm font-semibold text-white">Featured</p>
                <button
                  type="button"
                  onClick={() => setIsFeatured((v) => !v)}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
                >
                  {isFeatured ? "Yes" : "No"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Product Images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  const dataUrls = await Promise.all(
                    files.map(
                      (file) =>
                        new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(String(reader.result));
                          reader.onerror = () => reject(new Error("Failed to read file"));
                          reader.readAsDataURL(file);
                        }),
                    ),
                  );
                  setImages((prev) => [...prev, ...dataUrls]);
                  e.target.value = "";
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
                        <Image
                          src={src}
                          alt={`Product image ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="w-full border-t border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold text-white hover:text-brand"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <TextAreaField
              label="Product Description"
              value={description}
              onChange={setDescription}
              required
            />

            {formError ? <p className="text-sm text-white/80">{formError}</p> : null}
            {saved ? <p className="text-sm text-white/80">Saved.</p> : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C2177A]"
            >
              {editingId ? "Save changes" : "Add product"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 text-white">
            <p className="text-sm font-semibold text-white">
              Products ({sortedProducts.length})
            </p>
            <p className="mt-1 text-sm text-white/70">
              Tap a product to edit or delete it.
            </p>
          </div>

          <div className="grid gap-4">
            {sortedProducts.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-border bg-card p-5 text-white"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      unoptimized={p.image.startsWith("data:")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand">{p.category}</p>
                    <p className="mt-1 truncate font-semibold text-white">{p.name}</p>
                    <p className="mt-1 text-sm text-white/70">
                      ₦{Number(p.price).toLocaleString("en-NG")}
                      {p.inStock === false ? " • Out of stock" : ""}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {(p.hairType ?? "—") + (p.texture ? ` • ${p.texture}` : "")}
                      {p.isBestSeller ? " • Best Seller" : ""}
                      {p.isFeatured ? " • Featured" : ""}
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
                    onClick={() => {
                      const ok = window.confirm(`Delete "${p.name}"?`);
                      if (!ok) return;
                      const nextProducts = catalog.products.filter((x) => x.id !== p.id);
                      saveCatalogToStorage(nextProducts);
                      if (editingId === p.id) resetForm();
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Social Feed Images</p>
            <p className="mt-1 text-sm text-white/70">
              Upload up to 6 images for the homepage social strip.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const ok = window.confirm("Clear all social images?");
              if (!ok) return;
              socialFeed.clearAll();
            }}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-5 py-2 text-sm font-semibold text-white hover:border-brand/60"
          >
            Clear all
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {socialFeed.images.map((src, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-3xl border border-white/15 bg-black/40"
            >
              <div className="relative aspect-[4/3] w-full">
                {src ? (
                  <Image
                    src={src}
                    alt={`Social image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand">
                    <p
                      className="text-3xl leading-none text-white"
                      style={{ fontFamily: "var(--font-logo)" }}
                    >
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
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(new Error("Failed to read file"));
                        reader.readAsDataURL(file);
                      });
                      socialFeed.setSlot(idx, dataUrl);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => socialFeed.setSlot(idx, null)}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-semibold text-white hover:border-brand/60 disabled:opacity-60"
                  disabled={!src}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
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
  children: ReactNode;
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
