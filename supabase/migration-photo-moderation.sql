-- Moderação de fotos: só aprovadas entram na galeria pública.
-- Rodar no SQL Editor do Supabase.

alter table public.photos
  add column if not exists approved boolean not null default true;

-- Novos envios ficam pendentes; o que já existia permanece publicado.
alter table public.photos
  alter column approved set default false;

drop policy if exists "photos_update_public" on public.photos;
create policy "photos_update_public"
  on public.photos for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "photos_delete_public" on public.photos;
create policy "photos_delete_public"
  on public.photos for delete
  to anon, authenticated
  using (true);
