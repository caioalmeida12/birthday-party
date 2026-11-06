# Birthday Party — contexto

Site do aniversário para a galera participar pelo celular.

## Para que serve cada coisa

- **Músicas:** o convidado manda sugestões pelo **nome** ou pelo endereço (Spotify/YouTube); na hora da festa elas tocam na caixa de som. Não é só uma lista — é a trilha da celebração.
- **Fotos:** o convidado manda **antes** do dia. O anfitrião imprime e usa como decoração na festa. Foto de última hora pode não entrar na parede.

## Quem faz o quê

- **Convidado:** na entrada informa o nome/apelido (obrigatório uma vez neste celular); manda música, vota (gostei / não rolou), manda foto.
- **Anfitrião:** toca a fila na caixa (Bluetooth), reordena a fila ao vivo, remove música de vez, pula faixa. Votos mostram o gosto da galera; a ordem que toca é a que o anfitrião definir em `/tocar`.

## Tom

Português do Brasil, fala de festa — não de app. Evitar: link, playlist, player, skip, upvote, GitHub Pages.

## Operação

Commit + push em `main` e deploy (`npm run build` + `npx gh-pages -d dist`) podem rodar sem pedir de novo, quando a tarefa estiver pronta (gates ok).
