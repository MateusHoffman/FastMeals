# ADR-001: Hungarian para atribuição pedido → entregador

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

Pedidos `ready` e entregadores elegíveis formam um problema de **atribuição bipartida**: no máximo um pedido por entregador, minimizar **soma** das distâncias Haversine.

## Decisão

Implementar **Kuhn–Munkres (Hungarian)** em TypeScript (`backend/src/algorithms/`), com pad de matriz retangular e pós-processamento em `optimizeAssignment.ts`.

## Consequências

- Solução **ótima** para a função objetivo escolhida (soma de distâncias).
- Complexidade **O(k³)** com k = max(n, m) — adequada ao limite do desafio (n ≤ 50).
- Código auditável; optimalidade cruzada com brute-force em testes (`hungarian-optimality.test.ts`).
- Resposta HTTP e painel expõem **`baselineComparison`** vs greedy nearest-neighbor (baseline mediano do desafio).

## Alternativas consideradas

| Alternativa | Motivo de rejeição |
| ----------- | ------------------- |
| Greedy vizinho mais próximo | Pode aumentar distância total em cenários adversos |
| Permutação brute-force | O(n!) inviável |
| Lib npm (`munkres`) | Menos controle para revisão e testes no repo |
