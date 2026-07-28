export const GAP_X = 15;
export const LARGURA_PADDLE = 15;
export const LARGURA_LINHA = 15;
export const ALTURA_PADDLE_PADRAO = 200;
export const VELOCIDADE_JOGADOR = 7;

export const RAIO_BOLA = 20;
export const VELOCIDADE_MINIMA = 4;
export const ZONA_POTENCIA_RATIO = 0.3;
export const COR_ZONA_POTENCIA = "#FFD700";
export const DELTA_VELOCIDADE = 0.4;
export const DIRECOES_RESET = [-0.7, -0.35, 0, 0.35, 0.7];

export const MAX_RASTRO = 18;
export const CORES_RASTRO = [
  "#FF4444",
  "#44FF44",
  "#4488FF",
  "#FF44FF",
  "#FFAA00",
  "#00FFCC",
];

export const PONTOS_PARA_VENCER = 5;

// Campo lógico fixo do modo online — precisa bater com game.CampoLargura
// e game.CampoAltura no servidor Go (server/internal/game/constantes.go).
export const CAMPO_ONLINE_LARGURA = 1280;
export const CAMPO_ONLINE_ALTURA = 720;
