# Estratégia de testes

## Pirâmide

| Camada | Onde | Foco |
| ------ | ---- | ---- |
| Unitário | `backend/tests/unit/` | Máquina de estados, Haversine, optimalidade Hungarian |
| Integração | `backend/tests/integration/` | Rotas via `app.inject`, banco real |
| Contrato | `backend/tests/contract/` | Matriz vs `desafio/docs/api-spec.md` |
| Frontend | `frontend/src/**/*.test.tsx` | Componentes e API client |
| E2E | `e2e/*.spec.ts` | Playwright contra stack Compose |

## Comandos

```bash
npm run check          # lint + typecheck + todos os testes unit/integration/front
npm run test:summary   # contagens Vitest (backend + frontend)
npm run verify         # check:env + seed-sync + doc links + check + build
npm test               # idem testes
npm run test:backend
npm run test:frontend
npm run e2e:smoke      # smoke (CI; exige API+web — ex. `docker compose up -d db setup api web`)
npm run e2e            # suite completa
npm run e2e:a11y       # axe-core (login + pedidos; serious/critical)
npm run e2e:viewer     # perfil viewer read-only
npm run e2e:admin      # fluxo completo admin (@admin, ~2 min)
```

## Pré-requisitos backend

Postgres com migrate + seed (mesmo `DATABASE_URL` do `.env`):

```bash
docker compose up -d db
cd backend && npx prisma migrate deploy && npm run seed
```

## Oracles de seed

Testes em `seed-oracle.test.ts` e partes de `reports.test.ts` assumem dataset oficial (~15 produtos, receita entregue **370,80**). Se você rodou `npm run benchmark` com fixture 10k, o banco fica com >500 produtos e esses testes **falham com mensagem clara** — rode `cd backend && npm run seed:reset && npm run seed`.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml): `check`, `benchmark`, `e2e` (smoke + a11y + viewer), `e2e-admin`.
