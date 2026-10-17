# ADR-002: SSE para eventos de pedidos

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

Painel de pedidos deve refletir mudanças sem refresh manual. Desafio aceita polling 30 s; bônus cita WebSocket.

## Decisão

**Server-Sent Events** em `GET /api/orders/stream`; frontend `useOrderEvents` invalida cache TanStack Query. Fallback: polling 60 s em pedidos se SSE cair.

## Consequências

- Unidirecional (servidor → cliente), suficiente para status/assignment.
- Funciona bem com HTTP/2 e proxy Nginx; menos estado que WebSocket.
- Reconexão e auth via mesmo cookie/Bearer do SPA.

## Alternativas consideradas

| Alternativa | Trade-off |
| ----------- | --------- |
| WebSocket | Bidirecional; mais complexidade de infra e reconexão |
| Polling 30 s | Simples; latência maior e carga desnecessária |
| Redis pub/sub | Escala horizontal; fora do escopo monólito do desafio |
