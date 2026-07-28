## Ping Pong Cartoon

Jogo de ping pong com três modos: contra bot, multiplayer local (2
jogadores no mesmo teclado) e multiplayer online (via sala com código).

Front-end em Next.js (`web/`), back-end em Go (`server/`) — o back só é
necessário para o modo online; os modos bot e local rodam inteiramente
no navegador.

## Rodando localmente

Front-end:

    cd web
    npm install
    npm run dev

Abre em http://localhost:3000 — modos bot/local já funcionam sem mais nada.

Back-end (só necessário para jogar online):

    cd server
    go run ./cmd/server

Sobe em http://localhost:8080 (WebSocket em /ws, ranking em /api/ranking).
Salva os resultados num arquivo SQLite local (`server/ranking.db`,
ignorado pelo git).

Para o front encontrar um servidor em outro endereço (deploy, ou outra
máquina na rede), defina antes de rodar `npm run dev`/`npm run build`:

    NEXT_PUBLIC_WS_URL=ws://SEU_HOST:8080/ws
    NEXT_PUBLIC_API_URL=http://SEU_HOST:8080

## Estrutura

    web/      Next.js — telas, canvas do jogo, simulação local (bot/local)
    server/   Go — WebSocket, simulação autoritativa do modo online, ranking
    shared/protocol.md   contrato das mensagens WebSocket entre os dois lados
