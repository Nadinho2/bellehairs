import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendWelcomeEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : ({} as Record<string, unknown>);

  const email = normalizeEmail(String(payload.email ?? ""));
  const source = String(payload.source ?? "popup");

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const supabase = service ? service : await createSupabaseServerClient();

  const existing = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ ok: false, error: existing.error.message }, { status: 500 });
  }

  const alreadySubscribed = Boolean(existing.data?.id);

  const { error: upsertError } = await supabase
    .from("subscribers")
    .upsert({ email, source }, { onConflict: "email" });

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  if (!alreadySubscribed) {
    let emailSent = true;
    try {
      await sendWelcomeEmail({ to: email, source });
    } catch {
      emailSent = false;
    }
    return NextResponse.json({ ok: true, alreadySubscribed, emailSent });
  }

  return NextResponse.json({ ok: true, alreadySubscribed, emailSent: false });
}
