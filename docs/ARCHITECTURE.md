# Arquitetura — FastMeals

Visão de alto nível da solução. Decisões detalhadas: [`DECISIONS.md`](../DECISIONS.md) e [`adr/`](adr/).

## Componentes

```mermaid
flowchart LR
  subgraph client [Browser]
    SPA[React SPA]
  end
  subgraph edge [web Nginx :3000]
    static[SPA estática]
    proxy["/api → api"]
  end
  subgraph api [Fastify :3001]
    mod[módulos por domínio]
    algo[algorithms]
  end
  subgraph data [(PostgreSQL)]
    prisma[Prisma]
  end
  SPA --> edge
  proxy --> mod
  mod --> prisma
  mod --> algo
```

## Backend (monólito modular)

| Camada | Responsabilidade |
| ------ | ---------------- |
| `modules/*/routes.ts` | HTTP, auth, parsing |
| `modules/*/*.service.ts` | Regras de negócio, Prisma |
| `shared/validation` | Zod (body, query, params) |
| `shared/errors` | `AppError` + envelope único |
| `algorithms/` | Haversine + Hungarian (puro, testável) |

Pedidos: máquina de estados, histórico, SSE, transações **Serializable** em transições críticas.

## Frontend

SPA com React Router, TanStack Query (cache + invalidação), Zustand (auth). Proxy `/api` no Vite (dev) e Nginx (prod).

- **Motion** (`components/motion/`): transições de rota, modais, stagger em relatórios/atribuição; respeita `prefers-reduced-motion`.
- **SSE:** `useOrderEvents` + fallback por polling nas listagens.
- **Code-splitting:** rotas lazy; Recharts isolado em `ReportsCharts.tsx`.

## Testes e entrega

| Camada | Pasta |
| ------ | ----- |
| E2E | `e2e/` (smoke, axe, viewer, admin) |
| Contrato | `backend/tests/contract/` |
| Performance | `backend/scripts/benchmark.ts` + job CI |

Mapa de pastas: [`STRUCTURE.md`](STRUCTURE.md).

## Observabilidade

Métricas HTTP e do algoritmo em `GET /metrics`; stack opcional Prometheus + Grafana no Compose.
