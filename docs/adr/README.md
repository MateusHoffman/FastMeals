# Architecture Decision Records (ADRs)

Registro conciso de decisões irreversíveis ou caras de mudar. Contexto ampliado: [`DECISIONS.md`](../../DECISIONS.md).

| ADR | Título | Status |
| --- | ------ | ------ |
| [001](001-hungarian-assignment.md) | Hungarian para atribuição pedido → entregador | Aceito |
| [002](002-sse-order-events.md) | SSE para eventos de pedidos (vs WebSocket) | Aceito |
| [003](003-serializable-order-transitions.md) | Serializable em transições críticas de pedido | Aceito |
| [004](004-refresh-cookie-csrf.md) | Refresh httpOnly + CSRF em mutações | Aceito |
| [005](005-pg-trgm-product-search.md) | `pg_trgm` + GIN na busca de produtos | Aceito |
| [006](006-motion-ui-polish.md) | Motion no painel + tour em vídeo no README | Aceito |
| [007](007-api-extensions.md) | Rotas extras (session, accept-assignment) vs api-spec | Aceito |

**Formato:** problema → decisão → consequências → alternativas rejeitadas.
