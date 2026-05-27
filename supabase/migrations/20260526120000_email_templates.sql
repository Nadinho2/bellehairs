create extension if not exists pgcrypto;

create table if not exists public.email_templates (
  key text primary key,
  name text not null,
  category text not null default 'system',
  subject text not null,
  body_html text not null,
  offer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

alter table public.email_templates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'email_templates'
      and policyname = 'email_templates_read_auth'
  ) then
    create policy email_templates_read_auth
      on public.email_templates
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'email_templates'
      and policyname = 'email_templates_write_auth'
  ) then
    create policy email_templates_write_auth
      on public.email_templates
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

create table if not exists public.order_email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  template_key text not null references public.email_templates(key) on delete restrict,
  template_name text null,
  kind text not null,
  reminder_code text null,
  sent_to text not null,
  subject text not null,
  body_html text not null,
  offer jsonb not null default '{}'::jsonb,
  sent_by uuid null,
  sent_by_email text null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.order_email_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_email_events'
      and policyname = 'order_email_events_read_auth'
  ) then
    create policy order_email_events_read_auth
      on public.order_email_events
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_email_events'
      and policyname = 'order_email_events_insert_auth'
  ) then
    create policy order_email_events_insert_auth
      on public.order_email_events
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

create index if not exists order_email_events_order_id_sent_at_idx
  on public.order_email_events (order_id, sent_at desc);

create unique index if not exists order_email_events_unique_payment_reminder
  on public.order_email_events (order_id, reminder_code)
  where kind = 'payment_reminder' and reminder_code is not null;

insert into public.email_templates (key, name, category, subject, body_html, offer)
values
  (
    'payment_reminder_r1',
    'Reminder 1 — Gentle Nudge',
    'payment_reminder',
    '👀 Hey {{customer_first_name}}, you forgot something!',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Gentle reminder 💕</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, we received your order but we haven't seen payment yet.
  </p>
  {{order_summary}}
  {{payment_instructions}}
  <div style="margin-top:14px;">
    {{cta_button}}
  </div>
  <p style="margin:14px 0 0 0;color:#666;line-height:20px;font-size:12px;">
    If you've already paid, kindly send your proof of payment on WhatsApp and we'll confirm immediately.
  </p>
</div>
$$,
    '{}'::jsonb
  ),
  (
    'payment_reminder_r2',
    'Reminder 2 — Urgency',
    'payment_reminder',
    '⏰ {{customer_first_name}}, your order expires soon!',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Your order is still waiting ⏰</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, your items are not reserved forever. Complete payment now so we can start processing.
  </p>
  {{order_summary}}
  {{payment_instructions}}
  <div style="margin-top:14px;">
    {{cta_button}}
  </div>
</div>
$$,
    '{}'::jsonb
  ),
  (
    'payment_reminder_r3',
    'Reminder 3 — Free Delivery Offer',
    'payment_reminder',
    '💕 We saved your order + free delivery (today only)',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Free delivery offer 🚚</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong> — if you complete payment today, we’ll cover delivery for you.
  </p>
  {{offer_box}}
  {{order_summary}}
  {{payment_instructions}}
  <div style="margin-top:14px;">
    {{cta_button}}
  </div>
</div>
$$,
    jsonb_build_object('free_delivery', true)
  ),
  (
    'payment_reminder_r4',
    'Reminder 4 — 5% Discount (BELLE5)',
    'payment_reminder',
    '🔥 {{customer_first_name}}, here''s {{offer_discount_percent}}% off — today only',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">A little discount for you 🔥</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, use this code to get <strong>{{offer_discount_percent}}% off</strong> your order:
  </p>
  {{offer_box}}
  {{order_summary}}
  {{payment_instructions}}
  <div style="margin-top:14px;">
    {{cta_button}}
  </div>
</div>
$$,
    jsonb_build_object('discount_code', 'BELLE5', 'discount_percent', 5)
  ),
  (
    'payment_reminder_r5',
    'Reminder 5 — Last Chance + Free Wig Cap',
    'payment_reminder',
    '😢 Last chance, {{customer_first_name}}… we added a free wig cap',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Last chance 💔</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, we don’t want you to miss this order. Complete payment now and we’ll add a <strong>free wig cap</strong>.
  </p>
  {{offer_box}}
  {{order_summary}}
  {{payment_instructions}}
  <div style="margin-top:14px;">
    {{cta_button}}
  </div>
</div>
$$,
    jsonb_build_object('free_wig_cap', true)
  ),
  (
    'system_order_received',
    'Order Received',
    'system',
    '📦 We''ve Received Your Order — Belle Hairs',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">📦 We''ve Received Your Order</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, thank you for your order! We have received it and are waiting for your payment.
  </p>
  {{order_summary}}
  {{payment_instructions}}
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_payment_confirmed',
    'Payment Confirmed',
    'system',
    '✅ Payment Confirmed — Your Order is Being Processed!',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">✅ Payment Confirmed</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, we have confirmed your payment! 🎉
  </p>
  {{order_summary}}
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_order_confirmed',
    'Order Confirmed',
    'system',
    '🎀 Your Belle Hairs Order is Confirmed!',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">🎀 Order Confirmed</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, your order has been confirmed and is being carefully packed for you 💕
  </p>
  {{order_summary}}
  {{delivery_eta_box}}
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_dispatched',
    'Dispatched',
    'system',
    '🚚 Your Order is On Its Way — Belle Hairs',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">🚚 Your Order is On Its Way</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, great news! Your hair is on its way to you 🎉
  </p>
  {{order_summary}}
  {{delivery_eta_box}}
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_delivered',
    'Delivered',
    'system',
    '💕 Your Belle Hairs Order Has Been Delivered!',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">💕 Delivered</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, your order has been delivered! We hope you absolutely love your new hair 👑
  </p>
  {{order_summary}}
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_cancelled',
    'Cancelled',
    'system',
    '❌ Your Belle Hairs Order Has Been Cancelled',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">❌ Order Cancelled</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    Hi <strong>{{customer_name}}</strong>, your order has been cancelled.
  </p>
</div>
$$,
    '{}'::jsonb
  ),
  (
    'system_welcome',
    'Welcome Email',
    'system',
    'Welcome to the Belle Hairs VIP List 👑',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h1 style="margin:0 0 10px 0;font-size:22px;letter-spacing:-0.02em;">Welcome to the Belle Hairs VIP List 👑</h1>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    You''re officially on the list. Get first access to new arrivals, flash sales, and exclusive deals.
  </p>
  <div style="background:#fff7fb;border:1px solid #ffd0e7;border-radius:14px;padding:14px 14px;margin:12px 0 16px 0;">
    <div style="font-size:12px;color:#555;font-weight:800;letter-spacing:0.08em;">YOUR {{offer_discount_percent}}% CODE</div>
    <div style="font-size:26px;color:#E91E8C;font-weight:900;letter-spacing:0.02em;margin-top:6px;">{{offer_discount_code}}</div>
    <div style="margin-top:8px;font-size:13px;color:#444;line-height:20px;">
      Use this code at checkout to get {{offer_discount_percent}}% off your first order.
    </div>
  </div>
  <p style="margin:0 0 16px 0;color:#444;line-height:22px;font-size:14px;">
    Ready to shop? Tap below.
  </p>
  <div style="margin-top:10px;">
    <a href="https://bellehairs.vercel.app/products" style="display:inline-block;background:#E91E8C;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:800;">
      Shop Belle Hairs
    </a>
  </div>
  <p style="margin:16px 0 0 0;color:#666;line-height:20px;font-size:12px;">
    Subscribed via: {{source}}
  </p>
</div>
$$,
    jsonb_build_object('discount_code', 'BELLE10', 'discount_percent', 10)
  ),
  (
    'marketing_newsletter',
    'Newsletter/Campaign',
    'marketing',
    '✨ New from Belle Hairs — {{headline}}',
    $$
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
  <h2 style="margin:0 0 10px 0;font-size:20px;letter-spacing:-0.02em;">{{headline}}</h2>
  <p style="margin:0 0 14px 0;color:#444;line-height:22px;font-size:14px;">
    {{message}}
  </p>
  <div style="margin-top:14px;">
    <a href="{{cta_href}}" style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:800;">{{cta_label}}</a>
  </div>
</div>
$$,
    '{}'::jsonb
  )
on conflict (key) do nothing;
