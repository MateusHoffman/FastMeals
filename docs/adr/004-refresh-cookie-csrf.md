# ADR-004: Refresh em cookie httpOnly + CSRF

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

SPA admin precisa sessão persistente sem expor refresh token a JavaScript (XSS).

## Decisão

- **Access JWT** curto em memória (Zustand).
- **Refresh JWT** em cookie `httpOnly`, `Secure` em produção.
- Mutações autenticadas por cookie exigem header **CSRF** sincronizado com cookie.

## Consequências

- XSS não lê refresh trivialmente; mutações cross-site mitigadas.
- Client implementa fila single-flight de refresh em 401 (`api.ts`).
- Testes E2E cobrem persistência de sessão após reload.

## Alternativas consideradas

| Alternativa | Trade-off |
| ----------- | --------- |
| Refresh no localStorage | Simples; pior sob XSS |
| Session server-side (Redis) | Revogação centralizada; infra extra |
| Apenas access longo | Menos seguro; fora da spec (15m) |
