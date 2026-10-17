# Compliance — desafio FastMeals

Checklist de aderência ao [enunciado](../desafio/README.md). Como rodar e diagramas: [README](../README.md).

## Resumo executivo — 100% enunciado

Todos os requisitos funcionais e não funcionais de [`desafio/README.md`](../desafio/README.md) estão implementados: auth JWT (15m/7d, bcrypt, rate limit, roles), CRUD produtos/pedidos/entregadores, dashboard §5.1–5.5, algoritmo §6 (Haversine + minimização da soma de distâncias), validação Zod, envelope de erro, testes mínimos (≥10 back / ≥5 front), performance documentada, `DECISIONS.md`, `docker compose`, seed `seed/data.json`, README em `backend/` e `frontend/`.

**Extensões além da api-spec** (SPA, §5.5, observabilidade) estão listadas abaixo e documentadas em [ADR 007](adr/007-api-extensions.md) — não substituem os endpoints do desafio.

**“Listagem pública” de produtos:** não há storefront público; só painel admin autenticado. Produto com `isAvailable = false` continua visível no admin; a regra do enunciado aplica-se na **criação de pedido** (`UNAVAILABLE_PRODUCT`) e em filtros de listagem quando o cliente filtra por disponibilidade.

Detalhe linha a linha: seção **Requisitos obrigatórios → solução** abaixo.

## Entrega obrigatória (resumo)

| Item | Status | Evidência |
| ---- | ------ | --------- |
| Backend + frontend TypeScript `strict` | OK | `backend/tsconfig.json`, `frontend/tsconfig.json` |
| PostgreSQL + ORM + migrations | OK | `backend/prisma/`, `docker-compose.yml` |
| `DECISIONS.md` na raiz | OK | [`DECISIONS.md`](../DECISIONS.md) |
| `docker compose up` (db + api + web) | OK | serviços `db`, `setup`, `api`, `web` |
| README backend e frontend | OK | [`backend/README.md`](../backend/README.md), [`frontend/README.md`](../frontend/README.md) |
| Seed `seed/data.json` + `npm run seed` | OK | `backend/prisma/seed.ts`, serviço `setup` |
| Auth JWT + roles + rate limit | OK | `backend/src/modules/auth/`, `app.ts` |
| CRUD produtos / pedidos / entregadores | OK | módulos em `backend/src/modules/` |
| Dashboard §5.x | OK | `frontend/src/pages/` |
| Algoritmo §6 (Haversine + otimização) | OK | `backend/src/algorithms/`, testes de optimalidade |
| NF: validação Zod, envelope de erro | OK | `shared/validation/`, `app-error.ts` |
| NF: testes (≥10 back, ≥5 front) | OK | `npm run test:summary` — **56 + 12 = 68** casos Vitest (22 + 8 arquivos) |
| NF: performance listagens / optimize | OK | `npm run benchmark`, job CI `benchmark` |
| Evidência pública NF + observabilidade | OK | Tabela no [`README.md`](../README.md), [`benchmark-snapshot.json`](performance/benchmark-snapshot.json), print Grafana [`assets/grafana-dashboard.png`](assets/grafana-dashboard.png) |

## Requisitos obrigatórios → solução

Texto alinhado a [`desafio/README.md`](../desafio/README.md). Cada linha aponta o **artefato no repositório**.

| Requisito | Solução |
| --------- | ------- |
| Stack: React 18+ com TypeScript | `frontend/` — React 19; `strict: true` em `frontend/tsconfig.json` |
| Stack: Node.js com TypeScript (Express, Fastify ou Koa) | `backend/` — Fastify 5, ESM; `strict: true` em `backend/tsconfig.json` |
| Stack: PostgreSQL (ou MySQL ou MongoDB) com ORM | PostgreSQL 16 em `docker-compose.yml`; Prisma em `backend/prisma/` |
| Stack: framework de testes à escolha | Vitest — `backend/vitest.config.ts`, `frontend/vitest.config.ts` |
| Entrega: código fonte backend + frontend | `backend/`, `frontend/` |
| Entrega: `DECISIONS.md` na raiz (libs, algoritmo, arquitetura, dificuldades) | [`DECISIONS.md`](../DECISIONS.md) |
| Entrega: `docker-compose.yml` sobe backend + frontend + banco com um comando | `docker-compose.yml` — serviços `db`, `setup`, `api`, `web` |
| Entrega: instruções claras no README do backend e do frontend | [`backend/README.md`](../backend/README.md) · [`frontend/README.md`](../frontend/README.md) |
| Seed: ler `seed/data.json`, popular o banco, `npm run seed` no diretório `backend/` | `seed/data.json`; `backend/prisma/seed.ts`; script `"seed"` em `backend/package.json`; serviço Compose `setup` |
| Auth: perfil **admin** (CRUD produtos, pedidos, entregadores, relatórios) e **viewer** (somente leitura) | `UserRole`; `requireAdmin()` / `requireRole()` — `shared/middlewares/auth.ts` |
| Auth: JWT (access + refresh token) | `backend/src/modules/auth/auth.service.ts`, `auth.routes.ts` |
| Auth: access token expira em 15 minutos; refresh em 7 dias | `.env.example`, `backend/src/config/env.ts` |
| Auth: senhas com bcrypt (mínimo 10 salt rounds) | `bcrypt.hash(password, 10)`; seed em `prisma/seed.ts` |
| Auth: `401` token inválido/expirado; `403` permissão insuficiente | `AppError` + middlewares em `auth.ts` |
| Auth: rate limiting — máximo 100 requisições/minuto por IP | `@fastify/rate-limit` — `backend/src/app.ts` |
| Auth: usuários seed `admin@fastmeals.com` / `viewer@fastmeals.com` | `seed/data.json` |
| Produtos: CRUD com campos e enum `category` da spec | Model `Product`; `backend/src/modules/products/` |
| Produtos: validação no backend (Zod ou similar) | `shared/validation/product.schemas.ts` |
| Produtos: não deletar se vinculado a pedido `pending` ou `preparing` | `PRODUCT_IN_USE` — `product.service.ts` |
| Produtos: `isAvailable = false` não some do painel admin | Listagem admin com `deletedAt: null`; toggle `isAvailable`; soft delete |
| Produtos: listagem com paginação, busca por nome, filtro por categoria e disponibilidade | `product.service.ts`; migration `20261015180000_pg_trgm` |
| Pedidos: campos da spec; `totalAmount` calculado no backend | `Order`, `OrderItem`; `order.create.ts` |
| Pedidos: apenas transições válidas da spec; demais → erro **422** | `order-state-machine.ts`, `order.transitions.ts` |
| Pedidos: `ready` → `delivering` exige `deliveryPersonId` | `assertTransition` — `order-state-machine.ts` |
| Pedidos: não criar pedido com produto `isAvailable = false` | `UNAVAILABLE_PRODUCT` na criação |
| Pedidos: listagem com paginação, filtro por status, ordenação por data de criação | `order.queries.ts`, `order.routes.ts` |
| Entregadores: campos da spec | `DeliveryPerson` — `backend/prisma/schema.prisma` |
| Entregadores: CRUD (perfil admin) | `delivery-person.routes.ts`, `delivery-person.service.ts` |
| Dashboard §5.1 — login | `Login.tsx`, `ProtectedRoute.tsx`, `SessionBootstrap.tsx` |
| Dashboard §5.2 — painel de pedidos | `Orders.tsx`, `StatusBadge.tsx`, `Modal.tsx` |
| Dashboard §5.3 — produtos | `Products.tsx` |
| Dashboard §5.4 — métricas e gráficos | `reports.service.ts`, `Reports.tsx`, `ReportsCharts.tsx` |
| Dashboard §5.5 — atribuição otimizada | `Assignment.tsx`; `POST /api/orders/optimize-assignment` |
| Algoritmo §6 — endpoint e contrato | `order.routes.ts` → `optimizeAssignment.ts` |
| Algoritmo §6 — Haversine + minimizar soma das distâncias | `haversine.ts`, `hungarian.ts` |
| Algoritmo §6 — excedentes em `unassigned` | `optimizeAssignment.ts` |
| Algoritmo §6 — documentar no `DECISIONS.md` | [`DECISIONS.md`](../DECISIONS.md) §2 |
| NF: TypeScript `strict`; sem `any` | `backend/tsconfig.json`, `frontend/tsconfig.json` |
| NF: validar body, query e path | `shared/validation/*` |
| NF: envelope de erro padronizado | `shared/errors/app-error.ts` |
| NF: testes backend / frontend | `backend/tests/`, `frontend/src/**/*.test.ts(x)` |
| NF: performance (listagens / optimize) | `backend/scripts/benchmark.ts`, CI job `benchmark` |

## Requisitos extras (bônus implementados)

| Requisito (extra) | Solução |
| ----------------- | ------- |
| Tempo real (SSE; polling aceito) | `order.stream.ts`, `useOrderEvents.ts` |
| Swagger/OpenAPI | `/api/docs` — `shared/plugins/swagger.ts` |
| E2E Playwright | `e2e/*.spec.ts`, CI `e2e` + `e2e-admin` |
| Pino / logs estruturados | `backend/src/app.ts` |
| Health + métricas algoritmo | `health.routes.ts`, `metrics.ts` |
| CI lint + testes | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| Contrato api-spec | `tests/contract/api-spec.contract.test.ts` |
| Concorrência Serializable | `transaction.ts`, `orders-concurrency.test.ts` |
| Oracle pós-seed | `seed-oracle.test.ts`, `seed-data-source.test.ts` |
| Cache listagens | TanStack Query + invalidação |
| Prometheus + Grafana | `observability/`, Compose |
| Dark mode, Motion, axe a11y | `ThemeToggle`, `motion/`, `npm run e2e:a11y` |
| Hungarian vs greedy (UI + API) | `baselineComparison`; [`STANDOUT.md`](STANDOUT.md) |
| Extensões API documentadas | [ADR 007](adr/007-api-extensions.md) |
| Print Grafana (README) | [`assets/grafana-dashboard.png`](assets/grafana-dashboard.png) |

### Evidências de performance (SLO local)

- **`npm run benchmark`** — [`backend/scripts/benchmark.ts`](../backend/scripts/benchmark.ts)
- **`npm run explain`** — [`backend/scripts/explain-analyze.ts`](../backend/scripts/explain-analyze.ts)
- Snapshot versionado: [`performance/benchmark-snapshot.json`](performance/benchmark-snapshot.json)
- Artefatos locais (gitignored): `docs/benchmark-latest.json`, `docs/explain-analyze.txt`

## Seed canônico

| Arquivo | Papel |
| ------- | ----- |
| [`seed/data.json`](../seed/data.json) | **Canônico** — Docker, `npm run seed`, `seed-data-path.ts` |
| [`desafio/seed/data.json`](../desafio/seed/data.json) | Espelho do pacote do desafio (deve ser idêntico) |

Validação: `npm run check:seed-sync`

## Segredos e `.env`

| Regra | Status |
| ----- | ------ |
| `.env` real no git | **Proibido** — `.gitignore` + `npm run check:env` + CI |
| Template versionado | OK — `.env.example` na raiz |

Mapa de sinais para entrevista: [`EVALUATOR.md`](EVALUATOR.md).

## Gates locais

Ver checklist completo: [`ENTREGA.md`](ENTREGA.md).

```bash
cp .env.example .env
docker compose up --build   # smoke manual
npm run verify
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:smoke
```

Se rodou benchmark com fixture 10k, re-aplique o seed (`cd backend && npm run seed:reset && npm run seed`) antes dos oracles de receita.

---

← [REVIEW.md](REVIEW.md) · **Próximo →** [DECISIONS.md](../DECISIONS.md) — stack, algoritmo §6 e trade-offs documentados
