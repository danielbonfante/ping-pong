export type Direcao = { x: number; y: number };

export type PontoRastro = { x: number; y: number; cor: string };

export type EstadoPaddle = {
  y: number;
  w: number;
  h: number;
  corDaBarra: string;
  velocidade: number;
};

export type EstadoBola = {
  x: number;
  y: number;
  r: number;
  velocidade: number;
  direcao: Direcao;
  rastro: PontoRastro[];
  indiceCorRastro: number;
};

export type Vencedor = "esquerda" | "direita" | null;

export type EstadoJogo = {
  campoW: number;
  campoH: number;
  bola: EstadoBola;
  paddleEsquerda: EstadoPaddle;
  paddleDireita: EstadoPaddle;
  nomeEsquerda: string;
  nomeDireita: string;
  golsEsquerda: number;
  golsDireita: number;
  vencedor: Vencedor;
};
