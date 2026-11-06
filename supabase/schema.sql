-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  url text not null,
  submitted_by text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  submitted_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.song_votes (
  song_id uuid not null references public.songs (id) on delete cascade,
  voter_key text not null,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (song_id, voter_key)
);

create table if not exists public.song_skips (
  song_id uuid primary key references public.songs (id) on delete cascade,
  skipped_by text,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;
alter table public.photos enable row level security;
alter table public.song_votes enable row level security;
alter table public.song_skips enable row level security;

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

drop policy if exists "songs_update_public" on public.songs;
create policy "songs_update_public"
  on public.songs for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "songs_delete_public" on public.songs;
create policy "songs_delete_public"
  on public.songs for delete
  to anon, authenticated
  using (true);

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

drop policy if exists "song_votes_select_public" on public.song_votes;
create policy "song_votes_select_public"
  on public.song_votes for select
  to anon, authenticated
  using (true);

drop policy if exists "song_votes_insert_public" on public.song_votes;
create policy "song_votes_insert_public"
  on public.song_votes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "song_votes_update_public" on public.song_votes;
create policy "song_votes_update_public"
  on public.song_votes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "song_votes_delete_public" on public.song_votes;
create policy "song_votes_delete_public"
  on public.song_votes for delete
  to anon, authenticated
  using (true);

drop policy if exists "song_skips_select_public" on public.song_skips;
create policy "song_skips_select_public"
  on public.song_skips for select
  to anon, authenticated
  using (true);

drop policy if exists "song_skips_insert_public" on public.song_skips;
create policy "song_skips_insert_public"
  on public.song_skips for insert
  to anon, authenticated
  with check (true);

drop policy if exists "song_skips_delete_public" on public.song_skips;
create policy "song_skips_delete_public"
  on public.song_skips for delete
  to anon, authenticated
  using (true);

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

do $$
begin
  begin
    alter publication supabase_realtime add table public.songs;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.song_votes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.song_skips;
  exception when duplicate_object then null;
  end;
end $$;
