# EXPLAIN — busca de produtos por nome

Contexto: listagem admin com filtro `name ILIKE '%termo%'` em ~10k produtos.

## Índice

Migration `20261015180000_pg_trgm`: extensão **`pg_trgm`** + índice **GIN** em `products.name` (ver schema Prisma / SQL da migration).

## O que esperar no plano

Com seed/benchmark fixture populado, `npm run explain` (query `products_search`) deve mostrar uso de índice trigram, por exemplo:

- `Bitmap Index Scan` ou `Index Scan` usando índice GIN em `name`
- **Evitar** `Seq Scan on products` como plano dominante em 10k linhas

## Comando

```bash
docker compose up -d db
cd backend && npx prisma migrate deploy && npm run seed
npm run explain
```

Saída completa (local): `docs/explain-analyze.txt`.

## Decisão relacionada

[`docs/adr/005-pg-trgm-product-search.md`](../adr/005-pg-trgm-product-search.md)
