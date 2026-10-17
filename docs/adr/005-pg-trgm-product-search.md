# ADR-005: pg_trgm para busca de produtos

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

NF exige listagem rápida com ~10k produtos e filtro por nome (`ILIKE`).

## Decisão

Habilitar extensão **`pg_trgm`** e índice **GIN** em `products.name` (migration dedicada).

## Consequências

- Planos de query usam índice trigram em buscas parciais.
- Script `npm run explain` documenta planos; ver `docs/performance/explain-products-search.md`.
- Dependência de extensão PostgreSQL (aceita no desafio).

## Alternativas consideradas

| Alternativa | Trade-off |
| ----------- | --------- |
| ILIKE sem índice | Seq Scan; falha NF de latência |
| Full-text search (`tsvector`) | Melhor para linguagem natural; mais setup |
| Elasticsearch | Overkill para monólito do desafio |
