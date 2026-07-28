# Protocolo WebSocket — contrato cliente ↔ servidor

Fonte da verdade textual para as mensagens trocadas entre `web/lib/ws-client.ts`
(Next.js) e `server/internal/protocol` (Go). JSON, texto puro, um objeto por
mensagem. Go e TypeScript não compartilham tipos automaticamente — ao mudar um
lado, atualize este arquivo e o outro lado manualmente.

Endpoint: `GET /ws` (upgrade para WebSocket).

## Implementado (marco 6 — esqueleto de sala)

Ver também a seção "Implementado (marco 7 — simulação autoritativa)" abaixo.


### Cliente → Servidor

```jsonc
{ "type": "create_room", "playerName": "ANA" }
{ "type": "join_room", "code": "AB3F", "playerName": "BIA" }
{ "type": "leave" }
```

### Servidor → Cliente

```jsonc
// Para o anfitrião, resposta a create_room.
{ "type": "room_created", "code": "AB3F" }

// Para o convidado, resposta a join_room bem-sucedido.
{ "type": "joined", "code": "AB3F", "opponentName": "ANA" }

// Para o anfitrião, quando o convidado entra.
{ "type": "opponent_joined", "opponentName": "BIA" }

// Para o jogador restante, quando o outro lado desconecta.
{ "type": "opponent_disconnected" }

// Erros de protocolo (sala inexistente, sala cheia, etc).
{ "type": "error", "message": "sala não encontrada" }
```

Regras atuais: código de sala com 4 caracteres (alfabeto sem `0/O/1/I` para
evitar ambiguidade), sala aceita no máximo 2 jogadores, salas em espera sem
convidado são removidas após 10 minutos, e ao desconectar a sala é encerrada
imediatamente (sem grace period nesta versão).

## Implementado (marco 7 — simulação autoritativa)

Assim que o segundo jogador entra na sala (`joined`/`opponent_joined`), o
servidor cria a partida e começa a transmitir. Campo lógico fixo:
**1280×720** — o cliente escala/faz letterbox no canvas para caber nele
(isso também evita que o tamanho de tela de um jogador afete o outro).
Tick a **30Hz**. As velocidades abaixo já estão em px/tick a 30Hz (o
dobro dos valores do cliente local, que são px/frame a ~60fps — mesma
velocidade em px/segundo nos dois lados).

### Cliente → Servidor

```jsonc
// Direção pressionada/solta — o servidor integra a posição do paddle,
// nunca aceita posição absoluta do cliente.
{ "type": "paddle_input", "direction": "up" | "down" | "none" }
```

### Servidor → Cliente

```jsonc
// Início de partida — informa o lado controlado por este cliente e o
// tamanho do campo lógico.
{ "type": "match_start", "you": "left" | "right", "field": { "w": 1280, "h": 720 } }

// Snapshot de estado, um por tick (~30/s).
{
  "type": "state",
  "tick": 1234,
  "ball": { "x": 640, "y": 360 },
  "paddles": { "left": 310, "right": 310 },
  "score": { "left": 0, "right": 0 }
}

// Fim de partida (primeiro a 5 pontos).
{ "type": "match_end", "winner": "left" | "right", "score": { "left": 5, "right": 3 } }
```

Regras físicas portadas 1:1 de `web/components/game/simulacao.ts`: zona de
potência (30% central do paddle, +0.8 px/tick de velocidade por acerto),
quique na parede, variação de trajetória no rebote (25% de chance de
saída reta), 5 ângulos fixos de saque, vitória em 5 pontos. Paddle com
altura fixa (200px) — sem o crescimento por pontuação do modo bot, já
que essa mecânica é exclusiva da dificuldade contra IA. O rastro visual
da bola (efeito cosmético do cliente local) não é replicado no estado do
servidor.
