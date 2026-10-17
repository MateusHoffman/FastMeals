# Roteiro — demo ao vivo (entrevista)

Use com a stack já no ar (`docker compose up --build`).

## Pitch (~30 s)

Tratei §6 como **problema de atribuição linear** com solução **ótima** (Hungarian), não só greedy. Provo optimalidade em teste contra brute-force, mostro o **delta de km vs greedy** na UI e no benchmark versionado no CI. O restante segue a mesma linha: máquina de estados, transações Serializable, contrato testado contra a api-spec.

Texto completo: [`STANDOUT.md`](STANDOUT.md).

## Ordem sugerida (~8 min)

| Min | Ação | Evidência |
| --- | ---- | --------- |
| 0–1 | Login admin → navegação | JWT + refresh cookie (ver [`SECURITY.md`](SECURITY.md)) |
| 1–3 | **Atribuição** → *Sugerir atribuição otimizada* → ler banner Hungarian vs greedy | [`Assignment.tsx`](../frontend/src/pages/Assignment.tsx), `baselineComparison` |
| 3–4 | **Pedidos** → mudança de status contextuais; mencionar SSE se badge ativo | [`order-state-machine.ts`](../backend/src/modules/orders/order-state-machine.ts) |
| 4–5 | Abrir Swagger `POST /api/orders/optimize-assignment` | http://localhost:3001/api/docs |
| 5–8 | IDE: `hungarian-optimality.test.ts` → `api-spec.contract.test.ts` → padding matriz em `hungarian.ts` | Código auditável |

## Perguntas prováveis

Respostas expandidas: [`DECISIONS.md`](../DECISIONS.md) §5.

1. **Por que Hungarian?** Minimizar **soma** das distâncias; greedy não garante ótimo global.
2. **Matriz retangular?** Padding com custo 0 + filtro no pós-processamento.
3. **Serializable?** Duas transições concorrentes no mesmo pedido.
4. **Cookie + CSRF vs JWT no body?** Spec mantida para API clients; browser usa httpOnly + CSRF ([ADR 004](adr/004-refresh-cookie-csrf.md)).
5. **Benchmark 10k?** Fixture de performance; re-seed após rodar para não quebrar oracles.

## Arquivos para ter abertos

- [`backend/tests/unit/hungarian-optimality.test.ts`](../backend/tests/unit/hungarian-optimality.test.ts)
- [`backend/tests/contract/api-spec.contract.test.ts`](../backend/tests/contract/api-spec.contract.test.ts)
- [`backend/src/modules/orders/order-state-machine.ts`](../backend/src/modules/orders/order-state-machine.ts)
