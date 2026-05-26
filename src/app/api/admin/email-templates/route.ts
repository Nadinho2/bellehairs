import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailTemplateRow } from "@/lib/supabase/types";

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

function sanitizeHtml(input: string) {
  let html = String(input ?? "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  return html;
}

export async function GET() {
  const user = await requireAuthed();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const res = await supabase.from("email_templates").select("*").order("category", { ascending: true }).order("name", { ascending: true });
  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (msgLower.includes("does not exist") || msgLower.includes("schema cache")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing "email_templates" table in Supabase. Run the SQL migration in supabase/migrations/20260526120000_email_templates.sql and reload schema cache.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, templates: (res.data ?? []) as EmailTemplateRow[] });
}

export async function PATCH(request: Request) {
  const user = await requireAuthed();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const key = String(body.key ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const body_html = sanitizeHtml(String(body.body_html ?? ""));
  const offerRaw = body.offer;
  const offer = offerRaw && typeof offerRaw === "object" ? (offerRaw as Record<string, unknown>) : {};

  if (!key) return NextResponse.json({ ok: false, error: "Missing template key." }, { status: 400 });
  if (!subject) return NextResponse.json({ ok: false, error: "Subject is required." }, { status: 400 });
  if (!body_html) return NextResponse.json({ ok: false, error: "Email body is required." }, { status: 400 });

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const payload: Partial<EmailTemplateRow> & { key: string; updated_at: string; updated_by: string } = {
    key,
    subject,
    body_html,
    offer,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const res = await supabase.from("email_templates").update(payload).eq("key", key).select("*").maybeSingle();
  if (res.error) {
    const msgLower = (res.error.message || "").toLowerCase();
    if (
      (msgLower.includes("row-level security") || msgLower.includes("violates row-level security")) &&
      !service
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email template update was blocked by Supabase RLS. Add UPDATE policies on public.email_templates for authenticated users, or set SUPABASE_SERVICE_ROLE_KEY on the server.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, template: (res.data ?? null) as EmailTemplateRow | null });
}

