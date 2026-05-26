import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";

// #region debug-point admin-product-save-server-logger
async function debugReport(event: string, data?: Record<string, unknown>) {
  try {
    await fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ts: Date.now(),
        sessionId: "admin-product-save",
        runId: "pre",
        hypothesisId: "H*",
        source: "api-admin-products",
        event,
        data,
      }),
    });
  } catch {}
}
// #endregion debug-point admin-product-save-server-logger

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  // #region debug-point admin-product-save-auth
  await debugReport("auth-check", { hasUser: Boolean(data.user) });
  // #endregion debug-point admin-product-save-auth
  return Boolean(data.user);
}

export async function GET() {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: (data ?? []) as ProductRow[] });
}

export async function POST(request: Request) {
  // #region debug-point admin-product-save-post-start
  await debugReport("post-start", {});
  // #endregion debug-point admin-product-save-post-start
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = Number(body.price ?? 0);
  const images = Array.isArray(body.images) ? (body.images as unknown[]).map(String) : [];
  // #region debug-point admin-product-save-payload
  await debugReport("payload", {
    idPresent: Boolean(id),
    nameLen: name.length,
    category,
    price,
    imagesCount: images.length,
    hasLengthPrices: "length_prices" in body,
  });
  // #endregion debug-point admin-product-save-payload

  if (!id) return NextResponse.json({ ok: false, error: "Missing product id." }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "Product name is required." }, { status: 400 });
  if (!category) return NextResponse.json({ ok: false, error: "Category is required." }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ ok: false, error: "Enter a valid price." }, { status: 400 });
  }
  if (!images.length) {
    return NextResponse.json({ ok: false, error: "Upload at least one product image." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    id,
    name,
    category,
    hair_type: body.hair_type ?? null,
    texture: body.texture ?? null,
    closure_type: body.closure_type ?? null,
    accessory_type: body.accessory_type ?? null,
    lengths: Array.isArray(body.lengths) ? body.lengths : [],
    price,
    description: body.description ?? null,
    images,
    in_stock: body.in_stock ?? true,
    is_new_arrival: body.is_new_arrival ?? false,
    is_best_seller: body.is_best_seller ?? false,
    is_featured: body.is_featured ?? false,
  };
  if ("length_prices" in body) {
    payload.length_prices = body.length_prices && typeof body.length_prices === "object" ? body.length_prices : null;
  }

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { error } = await supabase.from("products").upsert(payload, { onConflict: "id" });
  if (error) {
    // #region debug-point admin-product-save-supabase-error
    await debugReport("supabase-error", { message: error.message });
    // #endregion debug-point admin-product-save-supabase-error
    const msg = error.message || "";
    const msgLower = msg.toLowerCase();
    if (msgLower.includes("length_prices") && msgLower.includes("does not exist")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing "length_prices" column in products table. Add it in Supabase: alter table public.products add column length_prices jsonb;',
        },
        { status: 500 },
      );
    }
    if (
      (msgLower.includes("row-level security") || msgLower.includes("violates row-level security")) &&
      !service
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Product update was blocked by Supabase RLS. Add an UPDATE policy on public.products for authenticated users (or admins), or set SUPABASE_SERVICE_ROLE_KEY on the server.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // #region debug-point admin-product-save-success
  await debugReport("success", {});
  // #endregion debug-point admin-product-save-success
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "Missing product id." }, { status: 400 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
