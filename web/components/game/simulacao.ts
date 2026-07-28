import {
  GAP_X,
  LARGURA_PADDLE,
  ALTURA_PADDLE_PADRAO,
  VELOCIDADE_JOGADOR,
  RAIO_BOLA,
  VELOCIDADE_MINIMA,
  ZONA_POTENCIA_RATIO,
  DELTA_VELOCIDADE,
  DIRECOES_RESET,
  CORES_RASTRO,
  MAX_RASTRO,
  PONTOS_PARA_VENCER,
} from "./constantesFisica";
import type { EstadoBola, EstadoJogo, EstadoPaddle } from "./tipos";

export type ModoPartida = "bot" | "local";

export type EntradaSimulacao = {
  modo: ModoPartida;
  teclas: Set<string>;
  ponteiroY: number;
};

function criarPaddle(): EstadoPaddle {
  return {
    y: 0,
    w: LARGURA_PADDLE,
    h: ALTURA_PADDLE_PADRAO,
    corDaBarra: "#ffffff",
    velocidade: 1,
  };
}

function corAleatoria(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

function reiniciarBola(campoW: number, campoH: number): EstadoBola {
  return {
    x: campoW / 2,
    y: campoH / 2,
    r: RAIO_BOLA,
    velocidade: VELOCIDADE_MINIMA,
    direcao: {
      x: Math.random() > 0.5 ? 1 : -1,
      y: DIRECOES_RESET[Math.floor(Math.random() * DIRECOES_RESET.length)],
    },
    rastro: [],
    indiceCorRastro: 0,
  };
}

/** Cria uma nova partida com placar zerado e raquetes no tamanho padrão. */
export function criarEstadoInicial(
  nomeEsquerda: string,
  nomeDireita: string,
  campoW: number,
  campoH: number
): EstadoJogo {
  const paddleEsquerda = criarPaddle();
  const paddleDireita = criarPaddle();
  paddleEsquerda.y = campoH / 2 - paddleEsquerda.h / 2;
  paddleDireita.y = campoH / 2 - paddleDireita.h / 2;

  return {
    campoW,
    campoH,
    bola: reiniciarBola(campoW, campoH),
    paddleEsquerda,
    paddleDireita,
    nomeEsquerda,
    nomeDireita,
    golsEsquerda: 0,
    golsDireita: 0,
    vencedor: null,
  };
}

/** Move a raquete esquerda: acompanha o ponteiro no modo bot, W/S no modo local. */
function moverPaddleEsquerda(estado: EstadoJogo, entrada: EntradaSimulacao) {
  const paddle = estado.paddleEsquerda;
  if (entrada.modo === "bot") {
    paddle.y = Math.max(
      0,
      Math.min(estado.campoH - paddle.h, entrada.ponteiroY - paddle.h / 2)
    );
  } else {
    const direcao =
      Number(entrada.teclas.has("KeyS")) - Number(entrada.teclas.has("KeyW"));
    paddle.y = Math.max(
      0,
      Math.min(estado.campoH - paddle.h, paddle.y + direcao * VELOCIDADE_JOGADOR)
    );
  }
}

/** Calcula a altura-alvo que a IA tenta interceptar. */
function calcularAlvoIA(estado: EstadoJogo): number {
  const { bola, paddleDireita } = estado;
  if (bola.direcao.x <= 0) return estado.campoH / 2;

  const limiteX = estado.campoW - paddleDireita.w - GAP_X - bola.r;
  const distancia = limiteX - bola.x;
  if (distancia <= 0) return bola.y;

  const tempo = distancia / bola.velocidade;
  return bola.y + bola.direcao.y * bola.velocidade * tempo;
}

/** Move a raquete direita: IA no modo bot, setas no modo local. */
function moverPaddleDireita(estado: EstadoJogo, entrada: EntradaSimulacao) {
  const paddle = estado.paddleDireita;
  if (entrada.modo === "bot") {
    const centroRaquete = paddle.y + paddle.h / 2;
    const alvoY = calcularAlvoIA(estado);
    const diferenca = alvoY - centroRaquete;
    const velEfetiva = Math.min(paddle.velocidade, estado.bola.velocidade * 0.85);

    if (Math.abs(diferenca) > velEfetiva) {
      paddle.y += Math.sign(diferenca) * velEfetiva;
    } else {
      paddle.y += diferenca;
    }
    paddle.y = Math.max(0, Math.min(estado.campoH - paddle.h, paddle.y));
  } else {
    const direcao =
      Number(entrada.teclas.has("ArrowDown")) - Number(entrada.teclas.has("ArrowUp"));
    paddle.y = Math.max(
      0,
      Math.min(estado.campoH - paddle.h, paddle.y + direcao * VELOCIDADE_JOGADOR)
    );
  }
}

function acertouZonaPotencia(bola: EstadoBola, paddle: EstadoPaddle): boolean {
  const centroY = paddle.y + paddle.h / 2;
  const meiaZona = (paddle.h * ZONA_POTENCIA_RATIO) / 2;
  return Math.abs(bola.y - centroY) <= meiaZona;
}

/** Define a inclinação do próximo trajeto, incluindo trajetos retos. */
function variarRota(bola: EstadoBola, paddle: EstadoPaddle) {
  const centroRaquete = paddle.y + paddle.h / 2;
  const impactoNormalizado = (bola.y - centroRaquete) / (paddle.h / 2);
  const aleatoriedade = (Math.random() - 0.5) * 0.5;
  let direcaoY = Math.max(-0.9, Math.min(0.9, impactoNormalizado * 0.8 + aleatoriedade));
  if (Math.random() < 0.25 || Math.abs(direcaoY) < 0.14) direcaoY = 0;
  bola.direcao.y = direcaoY;
}

/** Aplica o rebote horizontal, a velocidade e uma nova direção vertical. */
function rebater(estado: EstadoJogo, paddle: EstadoPaddle, lado: "esquerda" | "direita") {
  const { bola } = estado;
  bola.direcao.x = lado === "direita" ? -1 : 1;

  if (acertouZonaPotencia(bola, paddle)) {
    bola.velocidade += DELTA_VELOCIDADE;
    bola.indiceCorRastro = (bola.indiceCorRastro + 1) % CORES_RASTRO.length;
  } else {
    bola.velocidade =
      bola.velocidade <= VELOCIDADE_MINIMA
        ? VELOCIDADE_MINIMA
        : Math.max(VELOCIDADE_MINIMA, bola.velocidade - DELTA_VELOCIDADE);
  }

  variarRota(bola, paddle);
  bola.x =
    lado === "direita"
      ? estado.campoW - bola.r - paddle.w - GAP_X - 1
      : bola.r + paddle.w + GAP_X + 1;
}

function atingiuPaddle(bola: EstadoBola, paddle: EstadoPaddle): boolean {
  return bola.y + bola.r > paddle.y && bola.y - bola.r < paddle.y + paddle.h;
}

/**
 * Rubber-banding de dificuldade do bot: a raquete do bot cresce/acelera
 * quando o humano pontua, e a raquete do humano ganha uma assistência
 * (cresce) quando o bot pontua. Exclusivo do modo bot — nunca é chamado
 * no modo local, para manter o PvP justo.
 */
function aplicarDificuldadeBot(estado: EstadoJogo, ladoVencedor: "esquerda" | "direita") {
  const direita = estado.paddleDireita;
  const esquerda = estado.paddleEsquerda;

  if (ladoVencedor === "esquerda") {
    direita.velocidade += 0.1;
    if (estado.golsEsquerda > 0 && estado.golsEsquerda % 5 === 0) {
      direita.velocidade += 0.1;
      direita.h += 30;
      direita.corDaBarra = corAleatoria();
    }
  } else {
    direita.velocidade += 0.1;
    if (estado.golsDireita > 0 && estado.golsDireita % 5 === 0) {
      esquerda.h += 30;
      esquerda.corDaBarra = corAleatoria();
    }
    if (estado.golsDireita > 0 && estado.golsDireita % 10 === 0) {
      direita.velocidade = 0.1;
    }
  }
}

function pontoMarcado(
  estado: EstadoJogo,
  entrada: EntradaSimulacao,
  ladoVencedor: "esquerda" | "direita"
) {
  if (ladoVencedor === "esquerda") estado.golsEsquerda++;
  else estado.golsDireita++;

  if (entrada.modo === "bot") aplicarDificuldadeBot(estado, ladoVencedor);

  if (estado.golsEsquerda >= PONTOS_PARA_VENCER || estado.golsDireita >= PONTOS_PARA_VENCER) {
    estado.vencedor = estado.golsEsquerda >= PONTOS_PARA_VENCER ? "esquerda" : "direita";
  } else {
    estado.bola = reiniciarBola(estado.campoW, estado.campoH);
  }
}

/** Verifica paredes e raquetes; retorna true quando um ponto foi marcado. */
function verificarColisoes(estado: EstadoJogo, entrada: EntradaSimulacao): boolean {
  const { bola, paddleEsquerda, paddleDireita } = estado;

  if (bola.direcao.x > 0 && bola.x > estado.campoW - bola.r - paddleDireita.w - GAP_X) {
    if (atingiuPaddle(bola, paddleDireita)) {
      rebater(estado, paddleDireita, "direita");
    } else {
      pontoMarcado(estado, entrada, "esquerda");
      return true;
    }
  }

  if (bola.direcao.x < 0 && bola.x < bola.r + paddleEsquerda.w + GAP_X) {
    if (atingiuPaddle(bola, paddleEsquerda)) {
      rebater(estado, paddleEsquerda, "esquerda");
    } else {
      pontoMarcado(estado, entrada, "direita");
      return true;
    }
  }

  if (
    (bola.y - bola.r < 0 && bola.direcao.y < 0) ||
    (bola.y > estado.campoH - bola.r && bola.direcao.y > 0)
  ) {
    bola.direcao.y *= -1;
  }
  return false;
}

function atualizarBola(estado: EstadoJogo, entrada: EntradaSimulacao) {
  if (verificarColisoes(estado, entrada)) return;

  const { bola } = estado;
  bola.rastro.push({ x: bola.x, y: bola.y, cor: CORES_RASTRO[bola.indiceCorRastro] });
  if (bola.rastro.length > MAX_RASTRO) bola.rastro.shift();

  bola.x += bola.direcao.x * bola.velocidade;
  bola.y += bola.direcao.y * bola.velocidade;
}

/** Avança a simulação em um quadro; não faz nada se a partida já terminou. */
export function avancarSimulacao(estado: EstadoJogo, entrada: EntradaSimulacao) {
  if (estado.vencedor) return;
  moverPaddleEsquerda(estado, entrada);
  moverPaddleDireita(estado, entrada);
  atualizarBola(estado, entrada);
}
