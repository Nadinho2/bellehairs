create table if not exists public.homepage_hero_grid (
  slot text primary key,
  product_id uuid null references public.products(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

alter table public.homepage_hero_grid enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'homepage_hero_grid'
      and policyname = 'homepage_hero_grid_read_public'
  ) then
    create policy homepage_hero_grid_read_public
      on public.homepage_hero_grid
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'homepage_hero_grid'
      and policyname = 'homepage_hero_grid_write_auth'
  ) then
    create policy homepage_hero_grid_write_auth
      on public.homepage_hero_grid
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

insert into public.homepage_hero_grid (slot, product_id)
values
  ('slot_1', null),
  ('slot_2', null),
  ('slot_3', null),
  ('slot_4', null),
  ('slot_5', null)
on conflict (slot) do nothing;
