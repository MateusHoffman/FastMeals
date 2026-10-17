# Performance — evidências reproduzíveis

Requisitos não-funcionais do desafio:

- Listagens (`GET /api/products`, `GET /api/orders`) **p95 &lt; 200 ms** com ~10k registros.
- `POST /api/orders/optimize-assignment` **p95 &lt; 2000 ms** (50 pedidos / 30 entregadores no cenário sintético puro).

## Como reproduzir

```bash
cp .env.example .env
docker compose up -d db
cd backend && npm ci && npx prisma migrate deploy && npm run seed
npm run benchmark          # raiz, ou npm run benchmark --prefix backend
npm run explain            # planos EXPLAIN ANALYZE
```

Leitura do plano de busca de produtos (`pg_trgm`): [`explain-products-search.md`](explain-products-search.md).

Variáveis úteis:

| Variável | Efeito |
| -------- | ------ |
| `BENCHMARK_RUNS` | Amostras HTTP (padrão 30; CI usa 12) |
| `BENCHMARK_WRITE_SNAPSHOT` | Grava `docs/performance/benchmark-snapshot.json` |
| `SKIP_BENCHMARK_FIXTURE` | Pula carga sintética 10k (não use para validar NF) |
| `BENCHMARK_KEEP_FIXTURE` | Mantém 10k linhas após o script (quebra oracles de teste) |

## Artefatos

| Arquivo | Descrição |
| ------- | --------- |
| [`benchmark-snapshot.json`](benchmark-snapshot.json) | Último relatório versionado (atualize após mudanças de performance) |
| [`explain-products-search.md`](explain-products-search.md) | Trecho do plano de busca com `pg_trgm` |
| `docs/benchmark-latest.json` | Saída local (gitignored) |
| `docs/explain-analyze.txt` | Saída completa do script explain (gitignored) |

## CI

O workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) executa job **`benchmark`** após migrate + seed, com gate de falha nos mesmos limites do script.

## Métricas em runtime

- Histograma `assignment_optimization_duration_seconds` em `GET /metrics`
- Dashboard Grafana em http://localhost:3002 (Compose completo)
- Print de referência versionado: [`../assets/grafana-dashboard.png`](../assets/grafana-dashboard.png)
