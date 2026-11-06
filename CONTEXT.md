# Birthday Party — contexto

Site do aniversário para a galera participar pelo celular; notebook na TV é a central do anfitrião.

## Para que serve cada coisa

- **Músicas:** o convidado manda sugestões pelo **nome** ou pelo endereço (Spotify/YouTube); na hora da festa elas tocam na caixa de som.
- **Fotos decoração:** o convidado manda **antes** do dia (`kind=decor`). Entram pendentes; o anfitrião aprova em `/anfitriao` → Operação. Aprovadas vão pra galeria/impressão/mosaico.
- **Fotos ao vivo:** na festa (`kind=live`) aparecem na TV na hora; o anfitrião pode apagar. Migration: `supabase/migration-party-chat-live.sql` (+ `migration-photo-moderation.sql`).
- **Conversa:** chat nativo (`party_messages`) no celular (`/conversa`); mural na TV. Anfitrião pode esconder mensagem.

## Quem faz o quê

- **Convite:** 14/11/2026 (sábado), 19h, Sítio Jatobá (minha casa), Canindezinho. Guide-in + agenda + mapa + OG. RSVP: `supabase/migration-rsvps.sql`.
- **Convidado:** nome uma vez; músicas; conversa; foto decoração ou ao vivo.
- **Anfitrião:** `/anfitriao` (senha `VITE_HOST_PIN`). Vista **Fotos** ou **Fila**. Um QR grande (canto inferior) → home do site. Áudio sem clipe. **Operação**: RSVP + moderação decor.
- **Convidado (QR):** guide-in primeiro; depois cai na URL do QR (câmera ou músicas). Conversa só no menu depois de se identificar. Home enxuta: agenda, mapa, decoração, música.
- **Tela / fundo:** embed YouTube não toca com tela bloqueada. Modo festa = manter tela ligada; dá pra abrir no app YouTube se quiser fundo com Premium.

## Tom

Mensagem curta, fato primeiro. Fonte: `src/lib/copy.ts`. Sem onboarding de produto.

## Operação

Commit + push em `main` e deploy (`npm run build` + `npx gh-pages -d dist`) podem rodar sem pedir de novo, quando a tarefa estiver pronta (gates ok). Rodar migrations SQL no Supabase (incl. Realtime em `party_messages` e `photos`).

## Arte do convite

Coloque a imagem em `public/invite.jpg` (também aceita `.png` / `.webp`). Se não houver, cai no `public/invite.svg` padrão.
