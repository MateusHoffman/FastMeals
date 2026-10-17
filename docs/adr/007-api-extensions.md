# ADR 007 — Extensões de API além da api-spec

**Status:** Aceito

## Contexto

O [`desafio/docs/api-spec.md`](../../desafio/docs/api-spec.md) define o contrato mínimo. A SPA e o fluxo §5.5 exigem rotas adicionais que compõem o mesmo domínio sem quebrar os endpoints documentados.

## Decisão

Manter **100% dos endpoints da spec** (incl. `POST /auth/login` e `POST /auth/refresh` com tokens no body) e adicionar:

| Rota | Motivo |
| ---- | ------ |
| `POST /api/auth/session` (+ refresh via cookie) | Refresh httpOnly + CSRF para o browser; ver [ADR 004](004-refresh-cookie-csrf.md) |
| `POST /api/orders/:id/accept-assignment` | Aceitar uma sugestão do optimize: assign + transição para `delivering` (§5.5) |
| `POST /api/orders/accept-assignments` | Batch do mesmo fluxo na UI de Atribuição |

Campos extras em `POST /optimize-assignment` (`baselineComparison`, `algorithm`, `executionTimeMs`, nomes/endereços) servem ao painel e observabilidade; a forma mínima da spec permanece válida.

## Consequências

- Testes de contrato ([`api-spec.contract.test.ts`](../../backend/tests/contract/api-spec.contract.test.ts)) cobrem a spec; integração cobre accept-assignment.
- Avaliadores que testam só com curl/JWT usam login/refresh da spec; a SPA usa session + CSRF.

## Alternativas rejeitadas

- Forçar o frontend a guardar refresh no `localStorage` — pior superfície XSS.
- Dois PATCH manuais (assign + status) na UI após optimize — mais erros de operação.
