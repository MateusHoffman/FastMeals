# ADR-003: Serializable em transições críticas de pedido

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

Dois operadores podem alterar o mesmo pedido ou o mesmo entregador em paralelo (ex.: dois pedidos → `delivering` com o mesmo courier).

## Decisão

Usar transações Prisma com isolamento **`Serializable`** (`shared/database/transaction.ts`) em transições sensíveis, validando a máquina de estados antes do `update`.

## Consequências

- Previne estados inválidos e violação da regra “um `delivering` por entregador”.
- Pode gerar retry/abort sob contenção (aceitável no volume do desafio).
- Testes: `orders-concurrency.test.ts`, `orders-assignment-concurrency.test.ts`.

## Alternativas consideradas

| Alternativa | Trade-off |
| ----------- | --------- |
| Coluna `version` (optimistic lock) | Menos pressão no DB; cliente precisa retry explícito |
| Lock advisory PostgreSQL | Controle fino; mais código SQL manual |
| Read committed apenas | Risco de race em cenários testados |
