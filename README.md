# Birthday Party Webapp

Site simples para convidados sugerirem músicas (links Spotify/YouTube) e enviarem fotos para a decoração.

- **Front:** Vite + React + TypeScript, hospedado no **GitHub Pages**
- **Backend:** **Supabase** free (Postgres + Storage)

## Setup rápido

Wizard interativo (abre URLs, grava `.env` e secrets do GitHub):

```bash
./scripts/setup-wizard.sh
```

Rode a partir de qualquer lugar; o script entra na raiz do repo sozinho. Pode interromper com Ctrl-C e reexecutar — valores já no `.env` são oferecidos como default.

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (plano free).
2. Abra **SQL Editor**, cole e rode o arquivo [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Project Settings → API**, copie:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

### 2. Local

```bash
cp .env.example .env
# edite .env com as chaves e o nome da festa

npm install
npm run dev
```

Abra a URL do Vite (em geral `http://localhost:5173/birthday-party/`).

### 3. GitHub Pages

1. Crie o repositório `birthday-party` no GitHub e faça push desta pasta.
2. Em **Settings → Pages**, Source = **GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions**, adicione secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. (Opcional) Variables: `VITE_PARTY_NAME`, `VITE_PARTY_TAGLINE`.
5. Push em `main` dispara o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Site: `https://<seu-usuario>.github.io/birthday-party/`

Se o repositório tiver outro nome, ajuste `base` em [`vite.config.ts`](vite.config.ts).

## Baixar fotos para imprimir

No Supabase: **Storage → party-photos** (download individual) ou **Table Editor → photos** para ver quem enviou.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + build |
| `npm run typecheck` | Só TypeScript |
| `npm run preview` | Preview do `dist` |
