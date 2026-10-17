# FastMeals — one-pager (avaliador)

**O quê:** painel admin + API REST para gestão de pedidos delivery (desafio FastMeals).  
**Stack:** React 19 · Fastify 5 · PostgreSQL 16 · Prisma · TypeScript strict.

## Rodar em 1 comando

```bash
cp .env.example .env && docker compose up --build
```

→ http://localhost:3000 · `admin@fastmeals.com` / `Admin@123`

Gate local: `npm run verify:stack` · Mapa 100% enunciado: [`COMPLIANCE.md`](COMPLIANCE.md)

## Arquitetura (30 s)

Browser → Nginx (:3000) → Fastify (:3001) → Postgres. Job `setup` = migrate + seed. Bônus: Prometheus + Grafana.

## §6 — diferencial

- **Hungarian** (LAP) minimiza soma Haversine entregador → pedido.
- Prova: [`hungarian-optimality.test.ts`](../backend/tests/unit/hungarian-optimality.test.ts) vs brute-force (n,m ≤ 6).
- UI/API: `baselineComparison` vs greedy no mesmo dataset.
- Snapshot: [`performance/benchmark-snapshot.json`](performance/benchmark-snapshot.json) — 50×30: **226,2 km** vs greedy **229,83 km**; optimize p95 **4,5 ms** (SLO &lt; 2 s).

## Evidências rápidas

| Tema | Arquivo |
| ---- | ------- |
| Contrato api-spec | [`api-spec.contract.test.ts`](../backend/tests/contract/api-spec.contract.test.ts) |
| Máquina de estados | [`order-state-machine.ts`](../backend/src/modules/orders/order-state-machine.ts) |
| Concorrência | [`orders-concurrency.test.ts`](../backend/tests/integration/orders-concurrency.test.ts) |
| Decisões | [`DECISIONS.md`](../DECISIONS.md) · [`adr/`](adr/) |

## Onde clicar primeiro

Roteiro ~20 min: [`AVALIADORES.md`](../AVALIADORES.md) → tela **Atribuição** (Hungarian vs greedy). Métricas: [`assets/grafana-dashboard.png`](assets/grafana-dashboard.png).

## Extensões (não substituem a spec)

Session cookie + CSRF, `accept-assignment(s)`, SSE, métricas — [ADR 007](adr/007-api-extensions.md).
