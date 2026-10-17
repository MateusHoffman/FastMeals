# Checklist mental — sinais no código

Complemento enxuto ao roteiro [`REVIEW.md`](REVIEW.md). Entrada principal: [`AVALIADORES.md`](../AVALIADORES.md).

## Onde olhar (tabelas)

### Domínio e API

| Sinal | Onde olhar |
| ----- | ---------- |
| Máquina de estados | `order-state-machine.ts`, testes paramétricos |
| Concorrência | `transaction.ts`, `orders-concurrency.test.ts` |
| Contrato vs spec | `api-spec.contract.test.ts` |
| Oracle pós-seed | `seed-oracle.test.ts` — receita `delivered` = R$ 370,80 |

### §6 e operação

| Sinal | Onde olhar |
| ----- | ---------- |
| Hungarian | `hungarian.ts`, `optimizeAssignment.ts` |
| Optimalidade | `hungarian-optimality.test.ts` |
| Benchmark / CI | `npm run benchmark`, job `benchmark`, [`performance/README.md`](performance/README.md) |

### Frontend

| Sinal | Onde olhar |
| ----- | ---------- |
| Auth + CSRF | `api.ts`, `SessionBootstrap.tsx` |
| SSE + fallback | `useOrderEvents.ts` |
| A11y / Motion | `e2e:a11y`, `motion/`, `prefers-reduced-motion` |

### Entrega

| Sinal | Onde olhar |
| ----- | ---------- |
| Compose + seed | `docker-compose.yml`, serviço `setup` |
| Gates | `npm run verify`, `npm run verify:stack` |
| 100% enunciado | [`COMPLIANCE.md`](COMPLIANCE.md) |
| Extensões API | [ADR 007](adr/007-api-extensions.md) |

## Roadmap pós-desafio (fora de escopo)

Filas para optimize, OpenTelemetry, multi-tenant — ver final de [`REVIEW.md`](REVIEW.md) e §5 em [`DECISIONS.md`](../DECISIONS.md).
