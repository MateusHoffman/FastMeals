# DECISIONS.md — FastMeals

Documento de entrega do desafio: justificativas técnicas, algoritmo §6, arquitetura e dificuldades. O código-fonte é a referência final; aqui está o *porquê* das escolhas.

**ADRs detalhados:** [`docs/adr/`](docs/adr/) · **Segurança:** [`docs/SECURITY.md`](docs/SECURITY.md) · **Performance (benchmarks):** [`docs/performance/README.md`](docs/performance/README.md)

---

## 1. Bibliotecas e stack

### Backend

| Biblioteca | Papel | Por quê |
| ---------- | ----- | ------- |
| **Fastify 5** | HTTP API | Performance, schema de rotas, ecossistema maduro (CORS, helmet, rate-limit, Swagger). Alternativa considerada: Express — descartada por validação/serialização menos integrada. |
| **fastify-type-provider-zod + Zod 4** | Validação body/query/params | Tipagem compartilhada com respostas; erros estruturados alinhados ao contrato `{ error: { code, message, details? } }`. |
| **Prisma 6** | ORM + migrations | Migrations versionadas, tipos gerados a partir do schema, transações explícitas. PostgreSQL é o banco exigido pelo desafio. |
| **bcrypt** | Hash de senhas | 10 salt rounds conforme spec; comparação timing-safe no login. |
| **jsonwebtoken** | Access + refresh JWT | HS256; payloads tipados (`type: access \| refresh`); expiração via env (`15m` / `7d`). |
| **@fastify/cookie + CSRF** | Sessão no browser | Refresh em cookie `httpOnly`; mutações exigem header CSRF — reduz XSS roubar sessão completa. |
| **@fastify/rate-limit** | 100 req/min por IP | Requisito do desafio; health/metrics na allowlist. |
| **Pino** (via Fastify) | Logs estruturados | Redação de senha/token/cookie nos logs. |
| **prom-client** | Métricas Prometheus | Latência HTTP e histograma do algoritmo de atribuição (bônus). |
| **Vitest** | Testes | Mesmo runner no front/back; `inject` do Fastify para integração sem porta. |

**Algoritmo:** implementação própria em TypeScript (`backend/src/algorithms/`), sem dependência externa — facilita testes unitários, revisão de complexidade e evita versões opacas de libs de assignment.

### Frontend

| Biblioteca | Papel | Por quê |
| ---------- | ----- | ------- |
| **React 19 + Vite 8** | SPA admin | DX rápida, HMR, build enxuto; proxy `/api` → `:3001` em dev. |
| **TypeScript strict** | Tipagem | Alinhado ao NF do desafio; tipos espelhados em `types/api.ts`. |
| **React Router 7** | Rotas + layout | Login, pedidos, produtos, relatórios, atribuição. |
| **TanStack Query 5** | Cache e refetch | Listagens paginadas, invalidação após mutações; polling onde SSE não cobre. |
| **Zustand** | Estado de auth | Token em memória + bootstrap de sessão via refresh cookie. |
| **Tailwind CSS 4** | Estilo | Utility-first sem kit pesado (MUI/Chakra); componentes próprios demonstram customização. |
| **Recharts** | Gráficos §5.4 | Dois+ gráficos no dashboard de relatórios (lazy em `ReportsCharts.tsx`). |
| **Motion** (`motion/react`) | Animações de UI | Modais, rotas, KPIs, nav lateral; `prefers-reduced-motion`. |
| **lucide-react** | Ícones | Leve, tree-shakeable (tema claro/escuro). |
| **Vitest + Testing Library** | Testes de UI | Render, interação e fluxo de login. |

### Infra

- **Docker Compose:** Postgres 16, job `setup` (migrate + seed), API Node 22, Nginx servindo SPA e proxy `/api`.
- **Playwright** (raiz): E2E opcional contra stack completa.

---

## 2. Algoritmo §6 — otimização de atribuição

### Problema

Dados pedidos `ready` (coordenadas do pedido) e entregadores elegíveis (ativos, com GPS, sem pedido em `delivering`), atribuir **no máximo um pedido por entregador** minimizando a **soma das distâncias** entregador → pedido.

Isso é o **problema de atribuição linear** (LAP): matriz de custos \(C_{ij}\) = distância do entregador \(j\) ao pedido \(i\).

### Abordagem escolhida: Hungarian (Kuhn–Munkres)

1. **Haversine** (`haversine.ts`): distância geodésica em km entre WGS84 (raio 6371 km).
2. **Matriz de custos** \(n \times m\): `n` pedidos × `m` entregadores (`optimizeAssignment.ts`).
3. **Padronização quadrada** \(k \times k\) com \(k = \max(n, m)\): linhas/colunas fictícias recebem **custo 0** (pedido ou entregador não pareado); pares só contam se índices reais (`hungarian.ts`).
4. **Hungarian** (`hungarian.ts`): implementação clássica com dual variables; retorna pares \((i, j)\) de índice.
5. **Pós-processamento:** garante no máximo um par por linha e por coluna; pedidos sem par vão para `unassigned` com `reason: "No available delivery person"`. Entregadores sobrando não aparecem na lista (conforme spec §6 item 5).
6. **`totalDistanceKm`:** soma das distâncias arredondadas a 2 casas (`roundDistanceKm`).

**Endpoint:** `POST /api/orders/optimize-assignment` — carrega dados no Prisma (`order.service.ts` → `optimizeOrders`) e delega ao núcleo puro `optimizeAssignment`.

**Resposta:** contrato do desafio + campos extras úteis ao painel e observabilidade: `algorithm: "hungarian"`, `executionTimeMs`, enriquecimento com endereço/nome, e **`baselineComparison`** (km do greedy nearest-neighbor no mesmo dataset — deixa explícito por que não parar no “básico” do critério de avaliação).

### Complexidade

| Etapa | Complexidade | Comentário |
| ----- | ------------ | ---------- |
| Montar matriz Haversine | **O(n·m)** | 50×30 = 1 500 distâncias — trivial frente ao limite de 2 s. |
| Hungarian em matriz \(k \times k\) | **O(k³)** | \(k = \max(n, m)\); pior caso do desafio \(k \le 50\) → ~125 000 operações de inner loop — muito abaixo de 2 s em Node. |
| Consultas Prisma | O(n + m) | Índices em `status`, FKs; domina só se rede/DB estiver lenta. |

**Espaço:** O(k²) para a matriz quadrada padded.

### Trade-offs

| Opção | Prós | Contras |
| ----- | ---- | ------- |
| **Hungarian (escolhida)** | Solução **ótima** para minimizar soma de distâncias no LAP | O(k³); para centenas de milhares de pares seria necessário outro desenho |
| **Greedy (vizinho mais próximo)** | O(n·m log m) ou similar, simples | Pode aumentar distância total em 30–50% em cenários adversos; não atende espírito “minimizar soma” |
| **Brute-force permutações** | Trivial de codar | O(n!); **rejeitado** pelo desafio para n > 6 |
| **Lib npm (ex. `munkres`)** | Menos código | Dependência extra; esta solução prioriza código auditável e testável no repo |

### Optimalidade

Para a função objetivo **soma das distâncias** com capacidade 1 por entregador, o Hungarian encontra o matching de **custo mínimo** na matriz construída. Limitações de modelo (não considera rotas multi-parada, tráfego, capacidade de veículo) são aceitas pelo escopo do desafio.

### Testes e performance

- Integração: `backend/tests/integration/optimize.test.ts` (com solução; sem entregadores).
- Optimalidade: `backend/tests/unit/hungarian-optimality.test.ts` compara soma com **brute-force** (n,m ≤ 6).
- Benchmark reproduzível: `npm run benchmark` (raiz ou `backend/`) — gate de listagens &lt; 200 ms e optimize &lt; 2 s (50 pedidos / 30 entregadores); CI job **`benchmark`**; snapshot em `docs/performance/benchmark-snapshot.json`.
- Métrica Prometheus: `assignment_optimization_duration_seconds{algorithm="hungarian"}`.

---

## 3. Decisões arquiteturais

### Monólito modular (backend)

Pastas por domínio em `backend/src/modules/` (auth, products, orders, delivery-persons, reports, health). Regras de negócio em services; rotas finas; validação em `shared/validation/`. Erros via `AppError` + envelope único.

**Pedidos:** máquina de estados explícita (`order-state-machine.ts`); transições em transação **Serializable** quando necessário (`transaction.ts`) para concorrência em mudança de status. Histórico em `order_status_history`. Eventos SSE (`order.stream.ts`) para atualizar o painel.

**Produtos:** soft delete (`deletedAt`); produto indisponível (`isAvailable`) continua visível no admin; bloqueio de delete se houver pedido `pending`/`preparing`. Não há catálogo público anônimo — o enunciado fala em listagens públicas inexistentes neste escopo; indisponibilidade bloqueia **novos pedidos** e pode ser filtrada nas queries admin.

**Auth:** roles `admin` / `viewer`; middleware `requireAdmin` / `requireRole`. Viewer: leitura; admin: CRUD e optimize. `POST /auth/login` e `POST /auth/refresh` seguem a api-spec (tokens no JSON); rotas extras de sessão/CSRF para o browser: [ADR 007](docs/adr/007-api-extensions.md).

**API além da spec:** `accept-assignment(s)` implementa aceitar sugestão do optimize → `delivering` (§5.5); campos extras em optimize (`baselineComparison`, etc.) são bônus documentados em [`COMPLIANCE.md`](docs/COMPLIANCE.md).

### Frontend

SPA com rotas protegidas (`ProtectedRoute`, `SessionBootstrap`). API client central (`services/api.ts`) com refresh automático em 401. Páginas alinhadas às seções 5.x do desafio; atribuição em `Assignment.tsx` consumindo optimize + accept.

### Banco e seed

- Schema Prisma reflete `desafio/docs/database-schema.md` com extensões (histórico, índices, `pg_trgm` para busca de produtos).
- Seed lê **`seed/data.json`** (caminho resolvido em `prisma/seed-data-path.ts` para funcionar no Docker e no host).
- Migration `20261015170000_constraints`: triggers PL/pgSQL `set_updated_at()` em `users`, `products` e `orders`; constraints `CHECK` de latitude/longitude em pedidos; índice parcial único `uq_orders_one_delivering_per_person` (no máximo um pedido `delivering` por entregador).

### Segurança e deploy

- Helmet, CORS configurável, cookies `Secure` em produção via env.
- Compose: serviço `setup` roda migrate + seed uma vez; `api` só sobe após sucesso.
- Frontend em produção: Nginx + `VITE_API_URL=/api`.
- **Graceful shutdown:** `server.ts` trata `SIGTERM`/`SIGINT` com `app.close()` e `disconnectPrisma()` antes de encerrar o processo (deploy/restart sem conexões órfãs).

### Qualidade e CI

- Gate local na raiz: **`npm run verify`** = `check:env` (sem `.env` no git) + `npm run check` (ESLint + `tsc --noEmit` + Vitest back/front) + `npm run build`.
- GitHub Actions (`.github/workflows/ci.yml`): jobs **`check`**, **`benchmark`**, **`e2e`** (smoke, a11y, viewer), **`e2e-admin`** (fluxo completo `@admin`).
- Testes de integração e oracles de seed dependem do banco populado; o contract test (`tests/contract/`) valida aderência à api-spec sem substituir testes de domínio.

---

## 4. Dificuldades encontradas e soluções

1. **Transições concorrentes de pedido** — Dois admins alterando o mesmo pedido podiam gerar estados inválidos. *Solução:* transações com isolamento serializable + validação da máquina de estados antes do `update`; testes de concorrência em `orders-concurrency.test.ts`.

2. **Regra “produto indisponível no admin” vs spec de catálogo** — Admin deve ver produtos desligados sem apagar linha. *Solução:* listagem filtra `deletedAt: null` e usa `isAvailable` como toggle; exclusão lógica separada de indisponibilidade.

3. **Entregador “ocupado” na otimização** — Spec exige apenas quem não tem pedido em andamento. *Solução:* `optimizeOrders` exclui entregadores com pedido em `delivering` antes de chamar o Hungarian.

4. **Matriz retangular (n ≠ m)** — Hungarian clássico espera matriz quadrada. *Solução:* padding com **custo 0** em linhas/colunas fictícias (não parear não penaliza a soma); pares fictícios filtrados no pós-processamento; excedente de pedidos vira `unassigned`.

5. **Performance de listagem com ~10k registros** — Busca por nome com `ILIKE` puro escala mal. *Solução:* extensão `pg_trgm` + índice GIN; script `npm run explain` documenta planos.

6. **Sessão JWT no browser** — Access curto (15 min) exige refresh fluido. *Solução:* refresh em cookie httpOnly + fila single-flight no client para não disparar múltiplos refresh em paralelo.

7. **Seed no Docker vs host** — `cwd` diferente entre `tsx prisma/seed.ts` local e container. *Solução:* `resolveSeedDataPath()` tenta `seed/data.json` relativo ao repo e copia `seed/` na imagem (`backend/Dockerfile`).

---

## 5. Perguntas prováveis na entrevista técnica

1. **Por que Hungarian e não greedy?** Greedy é O(n·m) mas não garante mínimo da **soma** das distâncias; o desafio pede minimizar essa soma — LAP ótimo com O(k³), k ≤ 50, folga no SLO de 2 s.
2. **Por que Serializable e não só `SELECT FOR UPDATE`?** Duas transições concorrentes no mesmo pedido precisam serializar leitura+validação+write da máquina de estados; Serializable + retry documentado evita estado inválido sem lock manual em toda rota.
3. **SSE vs WebSocket aqui?** Fluxo admin unidirecional (servidor → painel); SSE sobre HTTP simplifica proxy Nginx, auth por cookie e reconexão; polling de fallback já cobre queda de stream.
4. **Refresh httpOnly + CSRF:** XSS não lê refresh; mutações exigem token CSRF sincronizado — trade-off clássico SPA com cookie de sessão.
5. **Recharts lazy + Motion no UI:** bundle inicial menor (gráficos só em `/reports`); Motion respeita `prefers-reduced-motion` — polish sem bloquear acessibilidade.

---

## 6. Referências rápidas no código

| Tópico | Caminho |
| ------ | ------- |
| Haversine | `backend/src/algorithms/haversine.ts` |
| Hungarian | `backend/src/algorithms/hungarian.ts` |
| Orquestração + API | `backend/src/algorithms/optimizeAssignment.ts`, `backend/src/modules/orders/order.service.ts` |
| Máquina de estados | `backend/src/modules/orders/order-state-machine.ts` |
| Contrato api-spec | `backend/tests/contract/api-spec.contract.test.ts` |
| Benchmark / EXPLAIN | `backend/scripts/benchmark.ts`, `backend/scripts/explain-analyze.ts` (`npm run benchmark`, `npm run explain`) |
| Compose | `docker-compose.yml` |
| Spec do desafio | `desafio/README.md` §6 |

---

← [COMPLIANCE.md](docs/COMPLIANCE.md) · **Próximo →** [docs/INDEX.md](docs/INDEX.md) — mapa de toda a documentação da solução
