-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  url text not null,
  submitted_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  submitted_by text,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;
alter table public.photos enable row level security;

drop policy if exists "songs_select_public" on public.songs;
create policy "songs_select_public"
  on public.songs for select
  to anon, authenticated
  using (true);

drop policy if exists "songs_insert_public" on public.songs;
create policy "songs_insert_public"
  on public.songs for insert
  to anon, authenticated
  with check (true);

drop policy if exists "photos_select_public" on public.photos;
create policy "photos_select_public"
  on public.photos for select
  to anon, authenticated
  using (true);

drop policy if exists "photos_insert_public" on public.photos;
create policy "photos_insert_public"
  on public.photos for insert
  to anon, authenticated
  with check (true);

insert into storage.buckets (id, name, public)
values ('party-photos', 'party-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "party_photos_select_public" on storage.objects;
create policy "party_photos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'party-photos');

drop policy if exists "party_photos_insert_public" on storage.objects;
create policy "party_photos_insert_public"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'party-photos');
