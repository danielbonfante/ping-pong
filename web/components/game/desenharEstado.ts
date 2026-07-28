import {
  GAP_X,
  LARGURA_LINHA,
  LARGURA_PADDLE,
  DELTA_VELOCIDADE,
  VELOCIDADE_MINIMA,
  ZONA_POTENCIA_RATIO,
  COR_ZONA_POTENCIA,
} from "./constantesFisica";
import type { EstadoJogo, EstadoPaddle } from "./tipos";

/** Desenha o fundo do campo. */
function desenharCampo(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  ctx.fillStyle = "#286047";
  ctx.fillRect(0, 0, estado.campoW, estado.campoH);
}

/** Desenha a linha divisória central. */
function desenharLinha(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(estado.campoW / 2 - LARGURA_LINHA / 2, 0, LARGURA_LINHA, estado.campoH);
}

/** Desenha uma raquete e sua zona de potência. */
function desenharPaddle(ctx: CanvasRenderingContext2D, x: number, paddle: EstadoPaddle) {
  ctx.fillStyle = paddle.corDaBarra;
  ctx.fillRect(x, paddle.y, paddle.w, paddle.h);

  const centroY = paddle.y + paddle.h / 2;
  const zonaH = paddle.h * ZONA_POTENCIA_RATIO;
  ctx.fillStyle = COR_ZONA_POTENCIA;
  ctx.fillRect(x, centroY - zonaH / 2, paddle.w, zonaH);
}

/** Desenha o placar com os nomes e a pontuação atual. */
function desenharPlacar(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#01341D";
  ctx.font = "bold 20px Arial";
  ctx.fillText(estado.nomeEsquerda, estado.campoW / 4, 22);
  ctx.fillText(estado.nomeDireita, estado.campoW / 4 + estado.campoW / 2, 22);
  ctx.font = "bold 72px Arial";
  ctx.fillText(String(estado.golsEsquerda), estado.campoW / 4, 50);
  ctx.fillText(String(estado.golsDireita), estado.campoW / 4 + estado.campoW / 2, 50);
}

/** Desenha o rastro com intensidade proporcional à velocidade atual da bola. */
function desenharRastro(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  const { bola } = estado;
  const intensidade = Math.min(
    1,
    Math.max(0, (bola.velocidade - VELOCIDADE_MINIMA) / (DELTA_VELOCIDADE * 2))
  );
  if (intensidade <= 0 || bola.rastro.length === 0) return;

  bola.rastro.forEach((posicao, indice) => {
    const progresso = (indice + 1) / bola.rastro.length;
    ctx.globalAlpha = progresso * (0.3 + intensidade * 0.5);
    ctx.fillStyle = posicao.cor;
    ctx.beginPath();
    ctx.arc(posicao.x, posicao.y, bola.r * (0.4 + progresso * 0.6), 0, 2 * Math.PI);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** Desenha a bola e seu rastro. */
function desenharBola(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  desenharRastro(ctx, estado);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(estado.bola.x, estado.bola.y, estado.bola.r, 0, 2 * Math.PI);
  ctx.fill();
}

/** Renderer "burro": desenha o snapshot recebido, sem conhecer regras de jogo. */
export function desenharEstado(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  desenharCampo(ctx, estado);
  desenharLinha(ctx, estado);
  desenharPaddle(ctx, GAP_X, estado.paddleEsquerda);
  desenharPaddle(ctx, estado.campoW - LARGURA_PADDLE - GAP_X, estado.paddleDireita);
  desenharPlacar(ctx, estado);
  desenharBola(ctx, estado);
}
