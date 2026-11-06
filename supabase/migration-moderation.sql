-- Moderação do anfitrião: ordem manual + remoção permanente.
-- Rode no SQL Editor do Supabase.

alter table public.songs
  add column if not exists position integer;

with ranked as (
  select id, row_number() over (order by created_at asc) as rn
  from public.songs
)
update public.songs as s
set position = ranked.rn
from ranked
where s.id = ranked.id
  and s.position is null;

update public.songs
set position = 0
where position is null;

alter table public.songs
  alter column position set default 0;

alter table public.songs
  alter column position set not null;

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
