# Estrutura do repositório

Mapa para navegação rápida. Entrada principal: [`README.md`](../README.md) · revisão: [`REVIEW.md`](REVIEW.md).

```
fastmeals-1.0/
├── backend/              API Fastify + Prisma + algoritmos
│   ├── prisma/           schema, migrations, seed
│   ├── src/
│   │   ├── algorithms/   Haversine, Hungarian, optimizeAssignment
│   │   ├── modules/      auth, orders, products, delivery-persons, reports
│   │   └── shared/       validation, errors, middlewares, plugins
│   └── tests/            unit, integration, contract
├── frontend/             SPA React (painel admin)
│   └── src/
│       ├── components/   UI + motion/
│       ├── pages/        Orders, Products, Reports, Assignment
│       └── services/     api.ts (JWT + CSRF + refresh)
├── desafio/              Enunciado e specs originais (não alterar como fonte)
├── seed/data.json        Dataset canônico (Docker + `npm run seed`)
├── e2e/                  Playwright (smoke, a11y, viewer, admin)
├── docs/assets/          Evidências visuais (ex.: Grafana)
├── observability/        Prometheus + Grafana (Compose)
├── docs/                 Documentação da solução
│   ├── adr/              ADRs
│   └── performance/      SLOs e benchmark
├── scripts/              Gates locais + CI (env, health, verify)
├── scripts/ci/           Checks usados no workflow
├── docker-compose.yml    db + setup + api + web (+ métricas)
└── DECISIONS.md          Entrega obrigatória — decisões técnicas
```

## O que ignorar na revisão

| Caminho | Motivo |
| ------- | ------ |
| `docs/benchmark-latest.json`, `docs/explain-analyze.txt` | Artefatos locais (gitignored) |
| `node_modules/` | Dependências |

## Gates de qualidade

| Comando | O que valida |
| ------- | ------------- |
| `npm run verify` | `check:env` + seed sync + links md + lint + testes + build |
| `npm run verify:stack` | Sobe `db`, migrate + seed, depois `verify` |
| `npm run check:seed-sync` | `seed/data.json` === `desafio/seed/data.json` |
| `npm run benchmark` | NF performance (listagens + optimize) |
| `npm run e2e:smoke` | Stack Compose + login + viewer |
