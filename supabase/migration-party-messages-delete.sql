-- Anfitrião pode apagar mensagens da conversa (hard delete).
-- Rodar no SQL Editor do Supabase.

drop policy if exists "party_messages_delete_public" on public.party_messages;
create policy "party_messages_delete_public"
  on public.party_messages for delete
  to anon, authenticated
  using (true);
