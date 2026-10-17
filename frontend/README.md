# FastMeals — Frontend (painel admin)

SPA em **React 19**, **TypeScript** (strict) e **Vite 8**, com **Tailwind CSS 4**. Consome a API em `/api` (proxy em dev, Nginx em Docker).

Decisões de stack e UX: [`DECISIONS.md`](../DECISIONS.md) na raiz.

**Motion:** animações com [`motion`](https://motion.dev/) (`motion/react`) — modais, login, transição de rotas, KPIs; respeita `prefers-reduced-motion`. Gráficos Recharts carregam lazy em `ReportsCharts.tsx`.

---

## Pré-requisitos

- **Node.js** ≥ 22
- API rodando (ver [`backend/README.md`](../backend/README.md))

Em desenvolvimento, o Vite escuta **http://localhost:3000** e encaminha `/api` → **http://127.0.0.1:3001**.

---

## Subir com Docker (recomendado)

Na **raiz** do repositório:

```bash
cp .env.example .env
docker compose up --build
```

Abra **http://localhost:3000**. Login seed: `admin@fastmeals.com` / `Admin@123`.

---

## Desenvolvimento local

1. Suba a API (Compose completo ou `backend/` com `npm run dev` — ver README do backend).
2. Neste diretório:

   ```bash
   npm ci
   npm run dev
   ```

3. Acesse **http://localhost:3000**.

Variável opcional (build Docker / preview): `VITE_API_URL` — padrão `/api` (ver [`.env.example`](../.env.example)).

---

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build estático em `dist/` |
| `npm run preview` | Preview do build |
| `npm test` | Vitest + Testing Library |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

Na raiz: `npm run check` e `npm run e2e` (Playwright, stack completa).

---

## Estrutura (resumo)

```
src/
  pages/          # Login, Orders, Products, Reports, Assignment
  components/     # Layout, modais, badges, paginação, etc.
  services/api.ts # Client HTTP + refresh de sessão
  hooks/          # auth, debounce, SSE de pedidos
  stores/         # auth (Zustand)
```

Telas cobrem o dashboard do desafio (§5): pedidos com filtros e status, CRUD de produtos, relatórios com gráficos, atribuição otimizada (§5.5).

---

## Testes

```bash
npm test
```

Não exige API em execução (mocks/`jsdom`). E2E na raiz: `npm run e2e` com backend + frontend + banco disponíveis.
