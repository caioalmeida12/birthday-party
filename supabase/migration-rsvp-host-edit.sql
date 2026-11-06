-- Anfitrião pode apagar RSVP no painel Quem vem.
-- Rodar no SQL Editor do Supabase.

drop policy if exists "rsvps_delete_public" on public.rsvps;
create policy "rsvps_delete_public"
  on public.rsvps for delete
  to anon, authenticated
  using (true);
