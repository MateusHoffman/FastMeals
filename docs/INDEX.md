# Documentação — FastMeals

Índice da documentação **da solução** (fora do pacote [`desafio/`](../desafio/README.md), que contém o enunciado e specs originais).

## Entrega e decisões

| Documento | Conteúdo |
| --------- | -------- |
| [`DECISIONS.md`](../DECISIONS.md) | Stack, algoritmo §6, arquitetura, dificuldades (entrega obrigatória) |
| [`README.md`](../README.md) | Como rodar, mapa requisito → código, diagramas |
| [`COMPLIANCE.md`](COMPLIANCE.md) | Checklist vs enunciado + mapa requisito → código |
| [`ENTREGA.md`](ENTREGA.md) | Checklist pré-envio (GitHub + gates) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Visão de componentes e camadas |
| [`STRUCTURE.md`](STRUCTURE.md) | Árvore do repo e o que ignorar na revisão |
| [`TESTING.md`](TESTING.md) | Pirâmide de testes e comandos |
## Nível sênior (revisão rápida)

| Documento | Conteúdo |
| --------- | -------- |
| [`AVALIADORES.md`](../AVALIADORES.md) | Porta de entrada (~20 min) |
| [`ONE-PAGER.md`](ONE-PAGER.md) | Resumo de 1 página (e-mail / triagem) |
| [`REVIEW.md`](REVIEW.md) | Roteiro ~20 min — comandos e onde olhar |
| [`EVALUATOR.md`](EVALUATOR.md) | Checklist mental (tabelas por tema) |
| [`STANDOUT.md`](STANDOUT.md) | Hook 60 s — §6 vs mediana |
| [`INTERVIEW-LIVE.md`](INTERVIEW-LIVE.md) | Demo ao vivo / entrevista |
| [`adr/`](adr/) | ADRs — Hungarian, SSE, Serializable, CSRF, `pg_trgm`, extensões API |
| [`SECURITY.md`](SECURITY.md) | Auth, CSRF, rate limit, superfície HTTP |
| [`performance/README.md`](performance/README.md) | SLOs, `npm run benchmark` / `explain`, CI |

## Specs oficiais do desafio

| Documento | Conteúdo |
| --------- | -------- |
| [`desafio/docs/api-spec.md`](../desafio/docs/api-spec.md) | Contrato REST |
| [`desafio/docs/database-schema.md`](../desafio/docs/database-schema.md) | Modelo de dados |
| [`desafio/docs/evaluation-criteria.md`](../desafio/docs/evaluation-criteria.md) | Critérios de avaliação |

## Dados de seed

- **Canônico (runtime e Docker):** [`seed/data.json`](../seed/data.json) — resolvido por `backend/prisma/seed-data-path.ts`.
- Cópia espelhada no pacote do desafio: [`desafio/seed/data.json`](../desafio/seed/data.json) (mesmo conteúdo).

## Artefatos locais (não versionados)

Gerados por `npm run benchmark` e `npm run explain`:

- `docs/benchmark-latest.json`
- `docs/explain-analyze.txt`

Snapshot versionado de referência: [`performance/benchmark-snapshot.json`](performance/benchmark-snapshot.json).

Observabilidade (README): [`assets/grafana-dashboard.png`](assets/grafana-dashboard.png) — ver [`assets/README.md`](assets/README.md).

## Qualidade

- Gate local: `npm run verify` = `check:env` + `check:seed-sync` + `check:docs` + lint + typecheck + testes + build.
- Com Postgres via Compose: `npm run verify:stack` ou `make verify-stack`.
- Contagens Vitest: `npm run test:summary`.
- Segredos: [`SECURITY.md`](SECURITY.md) § variáveis de ambiente; `npm run check:env`.
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `check`, `benchmark`, `e2e`, `e2e-admin`.
- Motion (UI): `frontend/src/components/motion/`.

---

← [DECISIONS.md](../DECISIONS.md) · **Próximo →** [README.md](../README.md) — visão geral, demo e como rodar (reinício do fluxo)

**Fluxo avaliador:** [README](../README.md) → [AVALIADORES](../AVALIADORES.md) → [STANDOUT](STANDOUT.md) → [REVIEW](REVIEW.md) → [COMPLIANCE](COMPLIANCE.md) → [DECISIONS](../DECISIONS.md) → INDEX
