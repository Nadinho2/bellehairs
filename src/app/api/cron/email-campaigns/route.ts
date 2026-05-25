import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendCampaignEmail } from "@/lib/email";
import type { EmailCampaignRow, EmailCampaignSegment, SubscriberRow } from "@/lib/supabase/types";

type SupabaseService = ReturnType<typeof createSupabaseServiceClient>;

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function fetchSubscribers(
  supabase: SupabaseService,
  segment: EmailCampaignSegment,
): Promise<SubscriberRow[]> {
  let query = supabase.from("subscribers").select("*").order("created_at", { ascending: false });
  if (segment === "customers") query = query.eq("source", "checkout");
  if (segment === "leads") query = query.in("source", ["popup", "footer", "exit"]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SubscriberRow[];
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

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") ?? "";
  const expected = process.env.EMAIL_CRON_SECRET ?? "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let supabase: SupabaseService;
  try {
    supabase = createSupabaseServiceClient();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Supabase service client not configured." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(3);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const campaigns = (data ?? []) as EmailCampaignRow[];
  let processed = 0;

  for (const campaign of campaigns) {
    processed += 1;
    try {
      await supabase.from("email_campaigns").update({ status: "sending" }).eq("id", campaign.id);

      const subscribers = await fetchSubscribers(supabase, campaign.segment);
      await runWithConcurrency(subscribers, 5, async (s) => {
        await sendCampaignEmail({ to: s.email, subject: campaign.subject, bodyHtml: campaign.body_html });
      });

      await supabase
        .from("email_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_count: subscribers.length,
        })
        .eq("id", campaign.id);
    } catch {
      await supabase
        .from("email_campaigns")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", campaign.id);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
