-- Chat da festa + fotos ao vivo (kind).
-- Rodar no SQL Editor do Supabase. Habilitar Realtime nas tabelas party_messages e photos.

create table if not exists public.party_messages (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  submitted_by text,
  created_at timestamptz not null default now(),
  hidden_at timestamptz
);

alter table public.party_messages enable row level security;

drop policy if exists "party_messages_select_public" on public.party_messages;
create policy "party_messages_select_public"
  on public.party_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "party_messages_insert_public" on public.party_messages;
create policy "party_messages_insert_public"
  on public.party_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "party_messages_update_public" on public.party_messages;
create policy "party_messages_update_public"
  on public.party_messages for update
  to anon, authenticated
  using (true)
  with check (true);

alter table public.photos
  add column if not exists kind text not null default 'decor';

alter table public.photos
  drop constraint if exists photos_kind_check;

alter table public.photos
  add constraint photos_kind_check check (kind in ('decor', 'live'));

-- Realtime (ignore se já estiver na publication)
do $$
begin
  alter publication supabase_realtime add table public.party_messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.photos;
exception
  when duplicate_object then null;
end $$;
