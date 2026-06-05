-- ============================================================
-- Lead & Order Management Dashboard Migration
-- ============================================================

-- 1. PROFILES TABLE (admin/staff roles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_auth'
  ) then
    create policy profiles_select_auth on public.profiles for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_auth'
  ) then
    create policy profiles_insert_auth on public.profiles for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_delete_auth'
  ) then
    create policy profiles_delete_auth on public.profiles for delete to authenticated using (true);
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'role', 'staff'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. UPDATE ORDERS TABLE — add new columns
alter table public.orders add column if not exists order_id_display text;
alter table public.orders add column if not exists source text not null default 'website';
alter table public.orders add column if not exists customer_phone_2 text;
alter table public.orders add column if not exists whatsapp_number text;
alter table public.orders add column if not exists state text;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists delivery_method text;
alter table public.orders add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
alter table public.orders add column if not exists internal_notes text;
alter table public.orders add column if not exists reminders_sent text[] default '{}';
alter table public.orders add column if not exists reminder_stopped boolean default false;
alter table public.orders add column if not exists bot_session_id text;
alter table public.orders add column if not exists status_history jsonb default '[]'::jsonb;

-- Auto-generate order_id_display
create or replace function public.generate_order_id_display()
returns trigger as $$
declare
  next_num integer;
begin
  if new.order_id_display is null then
    select coalesce(max(cast(substring(order_id_display from 'BH-(\d+)') as integer)), 0) + 1
    into next_num
    from public.orders
    where order_id_display ~ '^BH-\d+$';
    new.order_id_display := 'BH-' || lpad(next_num::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_order_id_display on public.orders;
create trigger trg_generate_order_id_display
  before insert on public.orders
  for each row execute function public.generate_order_id_display();

-- 3. LEADS TABLE
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text not null,
  customer_name text,
  enquiry_about text,
  last_message text,
  last_message_at timestamptz,
  follow_up_status text not null default 'not_contacted' check (follow_up_status in ('not_contacted', 'in_conversation', 'converted')),
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_order_id uuid references public.orders(id) on delete set null,
  notes text,
  source text not null default 'whatsapp_bot',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_select_auth') then
    create policy leads_select_auth on public.leads for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_insert_auth') then
    create policy leads_insert_auth on public.leads for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_update_auth') then
    create policy leads_update_auth on public.leads for update to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_delete_auth') then
    create policy leads_delete_auth on public.leads for delete to authenticated using (true);
  end if;
end $$;

-- 4. CUSTOMERS TABLE
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  phone text,
  whatsapp_number text,
  email text,
  state text,
  total_orders integer not null default 0,
  total_spent numeric not null default 0,
  last_order_date timestamptz,
  tag text not null default 'first_timer' check (tag in ('vip', 'regular', 'first_timer', 'cold_lead')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_select_auth') then
    create policy customers_select_auth on public.customers for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_insert_auth') then
    create policy customers_insert_auth on public.customers for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_update_auth') then
    create policy customers_update_auth on public.customers for update to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_delete_auth') then
    create policy customers_delete_auth on public.customers for delete to authenticated using (true);
  end if;
end $$;

-- Auto-tag VIP function
create or replace function public.auto_tag_customer()
returns trigger as $$
begin
  if new.total_orders >= 3 or new.total_spent >= 200000 then
    new.tag := 'vip';
  elsif new.total_orders >= 2 then
    new.tag := 'regular';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_tag_customer on public.customers;
create trigger trg_auto_tag_customer
  before update on public.customers
  for each row execute function public.auto_tag_customer();

-- 5. STAFF ACTIVITY LOG
create table if not exists public.staff_activity_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.profiles(id) on delete set null,
  staff_name text,
  action text not null,
  entity_type text check (entity_type in ('order', 'lead', 'customer')),
  entity_id uuid,
  details text,
  created_at timestamptz not null default now()
);

alter table public.staff_activity_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_activity_log' and policyname = 'sal_select_auth') then
    create policy sal_select_auth on public.staff_activity_log for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_activity_log' and policyname = 'sal_insert_auth') then
    create policy sal_insert_auth on public.staff_activity_log for insert to authenticated with check (true);
  end if;
end $$;

-- 6. PRODUCT ENQUIRIES
create table if not exists public.product_enquiries (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  product_id uuid references public.products(id) on delete set null,
  enquiry_count integer not null default 0,
  order_count integer not null default 0,
  last_enquired_at timestamptz
);

alter table public.product_enquiries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_enquiries' and policyname = 'pe_select_auth') then
    create policy pe_select_auth on public.product_enquiries for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_enquiries' and policyname = 'pe_insert_auth') then
    create policy pe_insert_auth on public.product_enquiries for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_enquiries' and policyname = 'pe_update_auth') then
    create policy pe_update_auth on public.product_enquiries for update to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_enquiries' and policyname = 'pe_delete_auth') then
    create policy pe_delete_auth on public.product_enquiries for delete to authenticated using (true);
  end if;
end $$;

-- 7. INDEXES
create index if not exists idx_orders_assigned_to on public.orders(assigned_to);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_source on public.orders(source);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_order_id_display on public.orders(order_id_display);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);
create index if not exists idx_leads_follow_up_status on public.leads(follow_up_status);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_tag on public.customers(tag);
create index if not exists idx_sal_created_at on public.staff_activity_log(created_at desc);
create index if not exists idx_sal_staff_id on public.staff_activity_log(staff_id);

-- 8. ENABLE REALTIME
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.customers;
