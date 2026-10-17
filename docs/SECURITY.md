# Segurança — FastMeals (escopo do desafio)

Visão objetiva para revisão e entrevista. Não substitui threat modeling de produção.

## Autenticação e sessão

- **Access token:** JWT HS256, curta duração (`15m`), enviado pelo client em `Authorization: Bearer`.
- **Refresh token:** JWT em cookie **`httpOnly`**, rotação via `/api/auth/session`.
- **Senhas:** bcrypt com 10 salt rounds; nunca retornadas ou logadas (redação Pino).

## Autorização

- Papéis **`admin`** e **`viewer`** (`UserRole`).
- Mutações de produtos, pedidos, entregadores, optimize e accept exigem **admin**.
- Respostas **`401`** (não autenticado) vs **`403`** (papel insuficiente).

## CSRF e browser

- Mutações com cookie de sessão exigem header **CSRF** (`shared/middlewares/csrf.ts`).
- SPA envia token CSRF após bootstrap de sessão (`frontend/src/services/api.ts`).

## Rate limiting

- **100 req/min por IP** (`@fastify/rate-limit`), com allowlist para health/metrics.
- Desabilitável via `DISABLE_RATE_LIMIT` apenas para dev/benchmark.

## Superfície HTTP

- **Helmet** + CORS configurável (`SPA_ORIGIN` / `CORS_ORIGIN`).
- Validação Zod em body, query e params; erros no envelope `{ error: { code, message, details? } }`.
- Sem SQL concatenado: Prisma parametrizado + migrations versionadas.

## Dados e integridade

- FKs, checks de coordenadas, índice parcial **um pedido `delivering` por entregador**.
- Transições de pedido via máquina de estados; concorrência com isolamento **Serializable** onde necessário.

## Variáveis de ambiente e segredos

- **Versionado:** apenas [`.env.example`](../.env.example) e [`desafio/.env.example`](../desafio/.env.example) (valores de **dev/demo**, não produção).
- **Nunca commitar:** `.env`, `.env.local`, `.env.production`, chaves `.pem`, `credentials.json`.
- **Local:** `cp .env.example .env` na raiz; Compose e scripts leem esse arquivo (gitignored).
- **CI:** segredos efêmeros no workflow; job `check` roda `npm run check:env` para impedir `.env` no índice git.
- **Gate local:** `npm run check:env` (incluído em `npm run verify`).
- **Produção:** trocar `JWT_*`, `POSTGRES_PASSWORD` e demais segredos; `backend/src/config/env.ts` recusa placeholders óbvios em `NODE_ENV=production`.

## Fora de escopo (aceito neste desafio)

- 2FA, OAuth, rotação de segredos automatizada, WAF, auditoria imutável, criptografia em repouso além do Postgres gerenciado.

## Referências no código

| Tópico | Caminho |
| ------ | ------- |
| Auth / JWT | `backend/src/modules/auth/` |
| Middlewares | `backend/src/shared/middlewares/auth.ts`, `csrf.ts` |
| Erros | `backend/src/shared/errors/app-error.ts` |
| ADRs | `docs/adr/` |
