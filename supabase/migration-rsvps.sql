-- Confirmação de presença (comidas/bebidas)
-- Rodar no SQL Editor do Supabase.

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  voter_key text not null unique,
  name text not null,
  attending boolean not null,
  plus_ones integer not null default 0
    check (plus_ones >= 0 and plus_ones <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

drop policy if exists "rsvps_select_public" on public.rsvps;
create policy "rsvps_select_public"
  on public.rsvps for select
  to anon, authenticated
  using (true);

drop policy if exists "rsvps_insert_public" on public.rsvps;
create policy "rsvps_insert_public"
  on public.rsvps for insert
  to anon, authenticated
  with check (true);

drop policy if exists "rsvps_update_public" on public.rsvps;
create policy "rsvps_update_public"
  on public.rsvps for update
  to anon, authenticated
  using (true)
  with check (true);
