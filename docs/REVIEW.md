# Roteiro de revisão (avaliadores)

Guia de **~20 minutos**. Entrada: [`AVALIADORES.md`](../AVALIADORES.md). Hook 60 s: [`STANDOUT.md`](STANDOUT.md). Checklist código: [`EVALUATOR.md`](EVALUATOR.md). Árvore: [`STRUCTURE.md`](STRUCTURE.md).

> **Benchmark:** após `npm run benchmark` com fixture 10k, rode `cd backend && npm run seed:reset && npm run seed` antes de confiar nos oracles de receita nos testes.

## 1. Subir e validar (5 min)

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000 — admin@fastmeals.com / Admin@123
```

Gate local automatizado:

```bash
npm run verify:stack
```

Manual (Postgres em `:5433`):

```bash
docker compose up -d db
cd backend && npm run migrate:deploy && npm run seed
cd .. && npm run verify
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:smoke   # stack api+web no ar
```

## 2. Onde olhar primeiro (sênior)

| Tema | Onde | Por quê |
| ---- | ---- | ------- |
| Algoritmo §6 | `backend/src/algorithms/`, `hungarian-optimality.test.ts` | Hungarian + optimalidade vs brute-force |
| Pedidos / concorrência | `order-state-machine.ts`, `transaction.ts`, `orders-concurrency.test.ts` | Máquina de estados + Serializable |
| API / contrato | `shared/validation/`, `api-spec.contract.test.ts` | Zod + matriz vs spec |
| Segurança | [`SECURITY.md`](SECURITY.md), `auth.service.ts`, `csrf.ts` | JWT, refresh httpOnly, CSRF, rate limit |
| Performance NF | `npm run benchmark`, [`performance/README.md`](performance/README.md) | SLOs reproduzíveis + job CI `benchmark` |
| Decisões | [`DECISIONS.md`](../DECISIONS.md), [`adr/`](adr/) | Justificativas e trade-offs |

## 3. Testes (3 min)

```bash
npm run check          # lint + typecheck + Vitest (back + front)
npm run e2e:smoke      # Playwright (stack Compose)
npm run e2e:a11y       # axe-core (login + pedidos)
npm run e2e:viewer     # viewer read-only
npm run e2e:admin      # fluxo produto → pedido → optimize → delivered
```

## 4. Diferenciais (bônus)

SSE pedidos, Swagger, CI (check + benchmark + e2e), Prometheus/Grafana, dark mode, Motion, testes de contrato — detalhe em [`COMPLIANCE.md`](COMPLIANCE.md) § extras.

## 5. Documentação canônica

- Enunciado: [`desafio/`](../desafio/README.md)
- Solução: [`docs/INDEX.md`](INDEX.md) · [`COMPLIANCE.md`](COMPLIANCE.md)
- Entrevista ao vivo: [`INTERVIEW-LIVE.md`](INTERVIEW-LIVE.md)

---

← [STANDOUT.md](STANDOUT.md) · **Próximo →** [COMPLIANCE.md](COMPLIANCE.md) — checklist enunciado vs implementação (passo 3)
