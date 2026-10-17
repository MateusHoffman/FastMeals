# Por que esta entrega se destaca

Hook de **60 segundos** para avaliadores que já viram dezenas de entregas iguais. Roteiro completo: [`AVALIADORES.md`](../AVALIADORES.md) · [`REVIEW.md`](REVIEW.md).

## Em 60 segundos

1. **Atribuição** → *Sugerir atribuição otimizada* → banner **Hungarian vs greedy**.
2. `npm run verify:stack` (ou stack Docker + login se preferir só UI).
3. Abrir [`hungarian-optimality.test.ts`](../backend/tests/unit/hungarian-optimality.test.ts) e [`DECISIONS.md`](../DECISIONS.md) §2.

## Mediana vs esta solução

| Tema | Entrega típica | Esta solução |
| ---- | -------------- | ------------ |
| §6 Atribuição | Greedy nearest-neighbor | **Hungarian ótimo** + teste vs brute-force + **comparativo greedy na UI** |
| Concorrência | Happy path | **Serializable** + [`orders-concurrency.test.ts`](../backend/tests/integration/orders-concurrency.test.ts) |
| Contrato | Manual | [`api-spec.contract.test.ts`](../backend/tests/contract/api-spec.contract.test.ts) |
| Performance NF | Anecdotal | [`benchmark-snapshot.json`](performance/benchmark-snapshot.json) + CI job `benchmark` |
| Decisões | README curto | **`DECISIONS.md`** + **7 ADRs** |

## Momento memorável

> *Hungarian com optimalidade testada — e mostro quantos km o greedy teria perdido no mesmo dataset.*

**Pitch 30 s:** ver [`INTERVIEW-LIVE.md`](INTERVIEW-LIVE.md).

**Artefatos:** `baselineComparison` no optimize, [`greedyBaseline.ts`](../backend/src/algorithms/greedyBaseline.ts), `algorithmCompare50x30` no snapshot.

---

← [AVALIADORES.md](../AVALIADORES.md) · **Próximo →** [REVIEW.md](REVIEW.md) — onde olhar no código (~10 min, passo 2)
