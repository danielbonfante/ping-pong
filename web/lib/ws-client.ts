// Cliente WebSocket tipado para o modo online. Implementa o contrato
// descrito em shared/protocol.md — ao mudar um lado, atualize o outro.

export type MensagemEnviada =
  | { type: "create_room"; playerName: string }
  | { type: "join_room"; code: string; playerName: string }
  | { type: "paddle_input"; direction: "up" | "down" | "none" }
  | { type: "leave" };

export type MensagemRecebida =
  | { type: "room_created"; code: string }
  | { type: "joined"; code: string; opponentName: string }
  | { type: "opponent_joined"; opponentName: string }
  | { type: "opponent_disconnected" }
  | { type: "error"; message: string }
  | { type: "match_start"; you: "left" | "right"; field: { w: number; h: number } }
  | {
      type: "state";
      tick: number;
      ball: { x: number; y: number };
      paddles: { left: number; right: number };
      score: { left: number; right: number };
    }
  | { type: "match_end"; winner: "left" | "right"; score: { left: number; right: number } };

function urlServidor(): string {
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
}

/** Abre a conexão e repassa cada mensagem já decodificada para `aoReceber`. */
export function abrirConexao(aoReceber: (mensagem: MensagemRecebida) => void): WebSocket {
  const ws = new WebSocket(urlServidor());
  ws.addEventListener("message", (evento) => {
    try {
      aoReceber(JSON.parse(evento.data) as MensagemRecebida);
    } catch {
      // mensagem malformada — ignora
    }
  });
  return ws;
}

export function enviar(ws: WebSocket, mensagem: MensagemEnviada) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(mensagem));
  }
}
