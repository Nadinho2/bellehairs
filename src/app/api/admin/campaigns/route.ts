import { NextResponse } from "next/server";

import { sendCampaignEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailCampaignRow, EmailCampaignSegment, SubscriberRow } from "@/lib/supabase/types";

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function sanitizeSubject(subject: string) {
  return subject.replace(/\s+/g, " ").trim();
}

function toSegment(value: string): EmailCampaignSegment {
  if (value === "customers") return "customers";
  if (value === "leads") return "leads";
  return "all";
}

function sanitizeHtml(input: string) {
  let html = String(input ?? "");
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/\son\w+="[^"]*"/gi, "");
  html = html.replace(/\son\w+='[^']*'/gi, "");
  return html;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let idx = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (idx < items.length) {
      const current = items[idx];
      idx += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function requireAuthed() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, supabase, user: null };
  return { ok: true as const, supabase, user: data.user };
}

async function fetchSubscribers(
  supabase: SupabaseServer,
  segment: EmailCampaignSegment,
): Promise<SubscriberRow[]> {
  let query = supabase.from("subscribers").select("*").order("created_at", { ascending: false });
  if (segment === "customers") query = query.eq("source", "checkout");
  if (segment === "leads") query = query.in("source", ["popup", "footer", "exit"]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SubscriberRow[];
}

export async function GET() {
  const auth = await requireAuthed();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campaigns: (data ?? []) as EmailCampaignRow[] });
}

export async function POST(request: Request) {
  const auth = await requireAuthed();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const subject = sanitizeSubject(String(body.subject ?? ""));
  const bodyHtml = sanitizeHtml(String(body.bodyHtml ?? ""));
  const segment = toSegment(String(body.segment ?? "all"));
  const scheduledAtRaw = body.scheduledAt ? String(body.scheduledAt) : null;
  const manualEmailsRaw = Array.isArray(body.manualEmails) ? (body.manualEmails as unknown[]) : null;
  const manualEmails = manualEmailsRaw
    ? manualEmailsRaw.map((e) => normalizeEmail(String(e))).filter((e) => isValidEmail(e))
    : [];

  if (subject.length < 3) {
    return NextResponse.json({ ok: false, error: "Subject is required." }, { status: 400 });
  }
  if (bodyHtml.trim().length < 10) {
    return NextResponse.json({ ok: false, error: "Email body is required." }, { status: 400 });
  }

  const scheduledAt =
    scheduledAtRaw && Number.isFinite(Date.parse(scheduledAtRaw)) ? new Date(scheduledAtRaw) : null;

  const now = new Date();
  const shouldSchedule = scheduledAt && scheduledAt.getTime() > now.getTime() + 15 * 1000;

  if (shouldSchedule && manualEmails.length) {
    return NextResponse.json(
      { ok: false, error: "Manual recipient list cannot be scheduled. Use Send Now." },
      { status: 400 },
    );
  }

  const campaignId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : null;
  const id = campaignId ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const insertPayload = {
    id,
    subject,
    body_html: bodyHtml,
    segment,
    scheduled_at: shouldSchedule ? scheduledAt!.toISOString() : null,
    status: shouldSchedule ? "scheduled" : "sending",
    sent_at: null,
    sent_count: null,
  };

  const { error: insertError } = await auth.supabase.from("email_campaigns").insert(insertPayload);
  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  if (shouldSchedule) {
    return NextResponse.json({ ok: true, scheduled: true, campaignId: id });
  }

  try {
    const recipients = manualEmails.length
      ? manualEmails.map((email) => ({ email } as SubscriberRow))
      : await fetchSubscribers(auth.supabase, segment);
    await runWithConcurrency(recipients, 5, async (s) => {
      await sendCampaignEmail({ to: s.email, subject, bodyHtml });
    });

    const { error: updateError } = await auth.supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: recipients.length,
      })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true,
      scheduled: false,
      campaignId: id,
      sentCount: recipients.length,
    });
  } catch (err) {
    await auth.supabase
      .from("email_campaigns")
      .update({ status: "failed", sent_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Failed to send campaign." },
      { status: 500 },
    );
  }
}
