# Checklist de entrega

Use antes de enviar o link do repositório aos avaliadores.

## Repositório (GitHub)

- [x] README abre com **como rodar** (Docker) e link [`AVALIADORES.md`](../AVALIADORES.md)
- [x] Badge CI aponta para o repositório correto (`MateusHoffman/FastMeals`)
- [x] **About:** descrição e topics configurados via `gh repo edit`
- [ ] Branch `main` com CI verde após push: jobs `check`, `benchmark`, `e2e`, `e2e-admin`

## Gates locais

```bash
cp .env.example .env          # nunca git add .env
npm run verify:stack          # db + migrate + seed + verify (recomendado)
# ou: npm run verify           # exige Postgres :5433 já migrado/seedado
npm run test:summary          # contagens Vitest (atualizar COMPLIANCE se mudou)
npm run check:seed-sync       # seed/data.json === desafio/seed/data.json
```

## Stack completa (smoke manual ~2 min)

```bash
docker compose up --build
# http://localhost:3000 — admin@fastmeals.com / Admin@123
# Atribuição → Sugerir otimização → banner Hungarian vs greedy
```

## E2E (stack já no ar)

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:smoke
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:a11y
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:viewer
npm run e2e:admin
```

## Documentação mínima para o avaliador

1. [`AVALIADORES.md`](../AVALIADORES.md)
2. [`ONE-PAGER.md`](ONE-PAGER.md) (opcional no e-mail)
3. [`STANDOUT.md`](STANDOUT.md)
4. [`DECISIONS.md`](../DECISIONS.md)
5. [`COMPLIANCE.md`](COMPLIANCE.md)

## O que não commitar

`.env`, `node_modules/`, `frontend/dist/`, `docs/benchmark-latest.json`, `docs/explain-analyze.txt`, `test-results/`
