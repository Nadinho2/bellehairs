import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderEmailEventRow } from "@/lib/supabase/types";

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

function parseOrderIds(value: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);
}

export async function GET(request: Request) {
  const ok = await requireAuthed();
  if (!ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const ids = parseOrderIds(url.searchParams.get("ids"));
  if (!ids.length) return NextResponse.json({ ok: true, events: [] satisfies OrderEmailEventRow[] });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const res = await supabase
    .from("order_email_events")
    .select("*")
    .in("order_id", ids)
    .order("sent_at", { ascending: false })
    .limit(1000);

  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (msgLower.includes("does not exist") || msgLower.includes("schema cache")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing "order_email_events" table in Supabase. Run the SQL migration in supabase/migrations/20260526120000_email_templates.sql and reload schema cache.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, events: (res.data ?? []) as OrderEmailEventRow[] });
}

