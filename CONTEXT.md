# Birthday Party — contexto

Site do aniversário para a galera participar pelo celular; notebook na TV é a central do anfitrião.

## Para que serve cada coisa

- **Músicas:** o convidado manda sugestões pelo **nome** ou pelo endereço (Spotify/YouTube); na hora da festa elas tocam na caixa de som. Fila de `/musicas` e play da TV usam a mesma ordem por score (gostei sobe). Empate → posição manual do anfitrião. Playhead não deixa faixa já tocada/atual pular a fila.
- **Fotos:** um só conceito pro convidado (`/fotos`, QR antigo `/camera` redireciona). Input **sem** `capture` e com `multiple` — galeria/câmera e vários arquivos de uma vez. HEIC da galeria iOS vira JPEG no upload (`heic-to`); HEIC legado no storage é convertido no `<PartyPhoto>` pra renderizar. Envio entra como `kind=decor`, pendente; o anfitrião publica em `/anfitriao` → Operação. Publicadas vão pra galeria, impressão, mosaico e mural da TV. Dá pra **apagar** publicadas na Operação. Legado `kind=live` ainda aparece no mural. Migration: `supabase/migration-photo-moderation.sql` (+ `migration-party-chat-live.sql`).
- **Conversa:** chat nativo (`party_messages`) no celular (`/conversa`, layout tipo chat: thread em cima, digitação embaixo); mural na TV. Em `/anfitriao`, cada mensagem tem **Apagar** (delete; se faltar policy, soft-hide). Migration: `supabase/migration-party-messages-delete.sql`.

## Quem faz o quê

- **Convite:** 14/11/2026 (sábado), 19h, Sítio Jatobá (minha casa), Canindezinho. Guide-in + agenda + mapa + OG. RSVP: `supabase/migration-rsvps.sql`.
- **Guide-in:** convite → nome → foto (escolher já confirma; ou depois) → RSVP em fases (uma pergunta por vez: vem? → sozinho/com alguém → quantidade). Em `/fotos`, escolher a imagem já envia (sem segundo toque em Enviar).
- **Convidado:** nome uma vez; músicas; conversa; foto. Menu hambúrguer no topo; em `/musicas` `/fotos` `/conversa`, abas semicirculares grudadas nas bordas (ícones Font Awesome, tipo livro).
- **Anfitrião:** `/anfitriao` (senha `VITE_HOST_PIN`). Vista **Fotos** ou **Fila**. Em Fotos: slide atual + faixa de últimas/próximas (clique pula), frente/trás, pausa, shuffle e velocidade. Player de música mostra **Agora** + **Depois**. Um QR grande (canto inferior) → home do site. Áudio sem clipe. **Operação**: RSVP + moderação (pendentes e publicadas).
- **Convidado (QR):** guide-in primeiro; depois cai na URL do QR (foto ou músicas). Conversa só no menu depois de se identificar. Home enxuta: agenda, mapa, foto, música.
- **Tela / fundo:** embed YouTube não toca com tela bloqueada. Modo festa = manter tela ligada; dá pra abrir no app YouTube se quiser fundo com Premium.

## Tom

Mensagem curta, fato primeiro. Fonte: `src/lib/copy.ts`. Sem onboarding de produto. Sem tela “duas coisas pra ajudar” (parecia botão).

## Operação

Commit + push em `main` e deploy (`npm run build` + `npx gh-pages -d dist`) podem rodar sem pedir de novo, quando a tarefa estiver pronta (gates ok). Rodar migrations SQL no Supabase (incl. Realtime em `party_messages` e `photos`).

## Arte do convite

Coloque a imagem em `public/invite.jpg` (também aceita `.png` / `.webp`). Se não houver, cai no `public/invite.svg` padrão.
