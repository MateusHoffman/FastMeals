# FastMeals — Backend (API)

API REST em **Node.js 22**, **TypeScript** (strict) e **Fastify 5**, com **PostgreSQL** e **Prisma**. Contrato alinhado a [`desafio/docs/api-spec.md`](../desafio/docs/api-spec.md).

Documentação de decisões técnicas: [`DECISIONS.md`](../DECISIONS.md) na raiz do repositório.

---

## Pré-requisitos

- **Node.js** ≥ 22
- **PostgreSQL** 16 (local ou via Docker na raiz do repo)

Variáveis de ambiente: copie [`.env.example`](../.env.example) para **`.env` na raiz do repositório** (Compose e scripts locais usam o mesmo arquivo). `npm run dev` e `npm run migrate:deploy` carregam esse `.env` automaticamente (`load-local-env.ts`).

Mínimo para desenvolvimento local:

```bash
DATABASE_URL=postgresql://fastmeals:fastmeals123@127.0.0.1:5433/fastmeals
JWT_SECRET=local-dev-jwt-secret-min-32-chars-change-me!!
JWT_REFRESH_SECRET=local-dev-refresh-secret-min-32-change!!
PORT=3001
SPA_ORIGIN=http://localhost:3000
```

---

## Subir com Docker (recomendado)

Na **raiz** do repositório:

```bash
cp .env.example .env
docker compose up --build
```

O serviço `setup` aplica migrations e seed; a API fica em **http://localhost:3001/api**. Swagger (se habilitado): **http://localhost:3001/api/docs**.

---

## Desenvolvimento local (sem rebuild da API)

1. Na raiz, suba só o banco:

   ```bash
   docker compose up -d db
   ```

2. Neste diretório (`backend/`):

   ```bash
   npm ci
   npm run migrate:deploy   # lê `.env` da raiz via scripts/prisma-cli.ts
   npm run seed
   npm run dev
   ```

A API escuta **http://127.0.0.1:3001** (prefixo `/api`). Health: `GET /api/health`.

---

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | API com reload (`tsx watch`) |
| `npm run build` | Compila para `dist/` |
| `npm start` | Produção (`node dist/src/server.js`) |
| `npm run seed` | Popula o banco a partir de [`seed/data.json`](../seed/data.json) |
| `npm run seed:reset` | Reset controlado + seed (dev) |
| `npm test` | Testes Vitest (unit + integração) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run benchmark` | Gate de performance (listagens + optimize) |
| `npm run explain` | EXPLAIN ANALYZE de queries críticas |

Na raiz: `npm run check` (lint + typecheck + testes) e `npm run benchmark`.

---

## Seed e usuários padrão

O seed lê **`seed/data.json`** (dataset oficial do desafio). Credenciais típicas após seed:

| E-mail | Senha | Papel |
| ------ | ----- | ----- |
| `admin@fastmeals.com` | `Admin@123` | admin |
| `viewer@fastmeals.com` | `Viewer@123` | viewer |

---

## Estrutura (resumo)

```
src/
  algorithms/     # Haversine + Hungarian (POST optimize-assignment)
  modules/        # auth, orders, products, delivery-persons, reports, health
  shared/         # prisma, erros, middlewares, validation, métricas
prisma/           # schema, migrations, seed
tests/            # unit + integration
```

Algoritmo de atribuição: `POST /api/orders/optimize-assignment` (perfil **admin**). Detalhes em [`DECISIONS.md`](../DECISIONS.md) §2.

---

## Testes

Requer banco acessível via `DATABASE_URL` (após migrate + seed):

```bash
npm test
```

Na **raiz** do repositório, com Postgres via Compose:

```bash
npm run verify:stack   # sobe db, migrate + seed, lint + testes + build
```

Testes de integração usam o dataset seedado (pedidos `ready`, entregadores, etc.).
