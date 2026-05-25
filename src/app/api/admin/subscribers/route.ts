import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriberRow } from "@/lib/supabase/types";

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function GET() {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: (data ?? []) as SubscriberRow[] });
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
  if (!id) return NextResponse.json({ ok: false, error: "Missing subscriber id." }, { status: 400 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();
  const { error } = await supabase.from("subscribers").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
