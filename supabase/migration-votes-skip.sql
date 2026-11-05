-- Additive migration for existing birthday-party projects.
-- Run in Supabase SQL Editor if the project already applied the original schema.

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

alter table public.song_votes enable row level security;
alter table public.song_skips enable row level security;

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
