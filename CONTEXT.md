# Birthday Party — contexto

Site do aniversário para a galera participar pelo celular.

## Para que serve cada coisa

- **Músicas:** o convidado manda sugestões pelo **nome** ou pelo endereço (Spotify/YouTube); na hora da festa elas tocam na caixa de som. Não é só uma lista — é a trilha da celebração.
- **Fotos:** o convidado manda **antes** do dia. O anfitrião imprime e usa como decoração na festa. Foto de última hora pode não entrar na parede.

## Quem faz o quê

- **Convite:** 14/11/2026 (sábado), 19h, Sítio Jatobá (minha casa), Canindezinho. Guide-in: convite (+ salvar na agenda), foto/música, nome, foto, RSVP (sim/não + acompanhantes). Migration: `supabase/migration-rsvps.sql`. Resumo em `/tocar`.
- **Convidado:** na entrada informa o nome/apelido (obrigatório uma vez neste celular); manda música, vota (gostei / não rolou), manda foto.
- **Anfitrião:** toca a fila na caixa (Bluetooth), reordena a fila ao vivo, remove música de vez, pula faixa. Votos mostram o gosto da galera; a ordem que toca é a que o anfitrião definir em `/tocar`.
- **Tela / fundo:** o embed do YouTube **não** continua com a tela bloqueada (Premium do app não vale no site). Em `/tocar`, o modo festa é **manter a tela ligada**; dá pra abrir a faixa no app YouTube se quiser fundo com Premium (aí a fila automática do site para).

## Tom

Mensagem curta, fato primeiro. Fonte: `src/lib/copy.ts`. Sem onboarding de produto, sem “cantinho”/“carinho”/“você está convidado pra celebrar”. Evitar jargão: playlist, player, skip, upvote.

## Operação

Commit + push em `main` e deploy (`npm run build` + `npx gh-pages -d dist`) podem rodar sem pedir de novo, quando a tarefa estiver pronta (gates ok).

## Arte do convite

Coloque a imagem em `public/invite.jpg` (também aceita `.png` / `.webp`). Se não houver, cai no `public/invite.svg` padrão.
