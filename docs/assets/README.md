# Assets de documentação

| Arquivo | Descrição |
| ------- | --------- |
| `fastmeals-demo.gif` | Preview animado do painel admin (loop) — exibido no topo do [`README.md`](../../README.md). |
| `fastmeals-demo.mp4` | Gravação em qualidade total; link “Abrir vídeo em tela cheia” no README. |
| `fastmeals-poster.png` | Frame estático opcional (não referenciado no README). |
| `grafana-dashboard.png` | Evidência de observabilidade (Prometheus + Grafana no Compose) — throughput e latência HTTP após carga manual ou uso real; exibido no topo do README. |

O README principal mostra GIF, botão para o MP4 e o print Grafana logo na abertura. Não há pipeline de captura automatizada no repositório: o avaliador sobe a stack com `docker compose up --build` e pode abrir **http://localhost:3002** (Grafana) ao vivo.
