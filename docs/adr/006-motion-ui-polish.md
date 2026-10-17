# ADR-006: Motion no painel (polish de UI)

**Status:** Aceito  
**Data:** 2026-10-16

## Contexto

Diferenciais do desafio citam animações sutis e UX de nível sênior, sem comprometer acessibilidade.

## Decisão

Usar **[Motion](https://motion.dev/)** (`motion/react`) para:

- transição entre rotas (`PageTransition`);
- entrada/saída de modais (`AnimatePresence`);
- stagger em KPIs de relatórios;
- login e loader.

Sempre respeitar **`prefers-reduced-motion`** (`useReducedMotion`).

## Consequências

- Bundle principal inclui runtime Motion; Recharts permanece lazy em `/reports`.
- Testes axe (`e2e:a11y`) garantem serious/critical no login e pedidos.

## Alternativas consideradas

| Alternativa | Motivo de rejeição |
| ----------- | ------------------- |
| CSS-only | Menos controle em modais e stagger coordenado |
| Remotion no SPA | Peso e propósito errado (vídeo batch vs UI interativa) |
