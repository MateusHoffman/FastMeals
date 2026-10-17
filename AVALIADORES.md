# Para avaliadores técnicos

Roteiro **~20 min** — da stack rodando à evidência de senioridade no código.

| Passo | Tempo | Ação |
| ----- | ----- | ---- |
| **0** | ~5 min | Subir a aplicação (abaixo) → login admin → **Atribuição** → *Sugerir atribuição otimizada* → banner **Hungarian vs greedy** |
| **1** | ~1 min | Hook escrito: [`docs/STANDOUT.md`](docs/STANDOUT.md) |
| **2** | ~10 min | [`docs/REVIEW.md`](docs/REVIEW.md) — onde olhar no código + testes |
| **3** | ~5 min | [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) — 100% enunciado vs extras |
| **4** | opcional | Gate local: **`npm run verify:stack`** (db + migrate + seed + verify) |

Decisões e algoritmo §6: [`DECISIONS.md`](DECISIONS.md) · ADRs: [`docs/adr/`](docs/adr/) · entrevista ao vivo: [`docs/INTERVIEW-LIVE.md`](docs/INTERVIEW-LIVE.md).

---

## Passo 0 — Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

- **http://localhost:3000** — `admin@fastmeals.com` / `Admin@123`
- Momento memorável: **Atribuição** + [`hungarian-optimality.test.ts`](backend/tests/unit/hungarian-optimality.test.ts)

---

## Quick verify (gate local)

Requer **Node 22+** e dependências instaladas (`npm ci` na raiz, `backend/`, `frontend/`).

```bash
npm run verify:stack
# equivalente: make verify-stack  ou  bash scripts/evaluator-verify.sh
```

Ou manualmente:

```bash
docker compose up -d db
cd backend && npm run migrate:deploy && npm run seed
cd .. && npm run verify
```

> **Atenção:** `npm run benchmark` com fixture ~10k produtos invalida oracles de receita nos testes. Depois do benchmark: `cd backend && npm run seed:reset && npm run seed`.

E2E com stack no ar: `PLAYWRIGHT_SKIP_WEBSERVER=1 npm run e2e:smoke`

---

## Mantenedor (antes de enviar link)

[`docs/ENTREGA.md`](docs/ENTREGA.md) — CI verde, GitHub About/topics, checklist pré-envio.

---

← [README.md](README.md) · **Próximo →** [docs/STANDOUT.md](docs/STANDOUT.md) — hook de 60 s (passo 1 do roteiro)
