import { campo } from "./campo.js";
import {
  canvasCtx,
  gapX,
  zonaPotenciaRatio,
  deltaVelocidade,
  velocidadeMinima,
  coresRastro,
} from "./constsGlobais.js";
import { raqueteDireita } from "./raqueteDireita.js";
import { raqueteEsquerda } from "./raqueteEsquerda.js";
import { placar } from "./placar.js";
import { partida } from "./partida.js";

const bola = {
  x: campo.w / 2,
  y: campo.h / 2,
  r: 20,
  velocidade: 2,
  direcao: { x: 1, y: 1 },
  rastro: [],
  maxRastro: 18,
  indiceCorRastro: 0,
  corRastro: coresRastro[0],
  _acertouCentro: function (raquete) {
    const centroY = raquete.y + raquete.h / 2;
    const meiaZona = (raquete.h * zonaPotenciaRatio) / 2;
    return Math.abs(this.y - centroY) <= meiaZona;
  },
  _trocarCorRastro: function () {
    this.indiceCorRastro = (this.indiceCorRastro + 1) % coresRastro.length;
    this.corRastro = coresRastro[this.indiceCorRastro];
  },
  _colidirComRaquete: function (raquete, lado) {
    this.direcao.x = lado === "direita" ? -1 : 1;

    if (this._acertouCentro(raquete)) {
      this.velocidade += deltaVelocidade;
      this._trocarCorRastro();
    } else {
      this.velocidade = Math.max(velocidadeMinima, this.velocidade - deltaVelocidade);
    }

    this._variarRota(raquete);

    if (lado === "direita") {
      this.x = campo.w - this.r - raquete.w - gapX - 1;
    } else {
      this.x = this.r + raquete.w + gapX + 1;
    }
  },
  _calcularColisao: function () {
    if (
      this.direcao.x > 0 &&
      this.x > campo.w - this.r - raqueteDireita.w - gapX
    ) {
      if (
        this.y + this.r > raqueteDireita.y &&
        this.y - this.r < raqueteDireita.y + raqueteDireita.h
      ) {
        this._colidirComRaquete(raqueteDireita, "direita");
      } else {
        placar.pontoHumano();
        this._pontoFeito();
      }
    }

    if (
      this.direcao.x < 0 &&
      this.x < this.r + raqueteEsquerda.w + gapX
    ) {
      if (
        this.y + this.r > raqueteEsquerda.y &&
        this.y - this.r < raqueteEsquerda.y + raqueteEsquerda.h
      ) {
        this._colidirComRaquete(raqueteEsquerda, "esquerda");
      } else {
        placar.pontoComputador();
        this._pontoFeito();
      }
    }

    if (
      (this.y - this.r < 0 && this.direcao.y < 0) ||
      (this.y > campo.h - this.r && this.direcao.y > 0)
    ) {
      this._reverteDirecaoY();
    }
  },
  _reverteDirecaoY: function () {
    this.direcao.y *= -1;
  },
  _pontoFeito: function () {
    this.x = campo.w / 2;
    this.y = campo.h / 2;
    this.velocidade = 2;
    this.rastro = [];
    this.indiceCorRastro = 0;
    this.corRastro = coresRastro[0];
  },
  _variarRota: function (raquete) {
    const centroDaRaquete = raquete.y + raquete.h / 2;
    const impacto = (this.y - centroDaRaquete) / (raquete.h / 2);
    const aleatoriedade = (Math.random() - 0.5) * 0.5;
    let direcaoY = Math.max(-0.9, Math.min(0.9, impacto * 0.8 + aleatoriedade));

    if (Math.random() < 0.25 || Math.abs(direcaoY) < 0.14) {
      direcaoY = 0;
    }

    this.direcao.y = direcaoY;
  },
  reiniciar: function () {
    this.x = campo.w / 2;
    this.y = campo.h / 2;
    this.velocidade = 2;
    const direcoesVerticais = [-0.7, -0.35, 0, 0.35, 0.7];
    this.direcao = {
      x: Math.random() > 0.5 ? 1 : -1,
      y: direcoesVerticais[Math.floor(Math.random() * direcoesVerticais.length)],
    };
    this.rastro = [];
    this.indiceCorRastro = 0;
    this.corRastro = coresRastro[0];
  },
  _registrarRastro: function () {
    this.rastro.push({ x: this.x, y: this.y, cor: this.corRastro });
    if (this.rastro.length > this.maxRastro) {
      this.rastro.shift();
    }
  },
  _drawRastro: function () {
    const intensidade = Math.min(1, Math.max(0, (this.velocidade - 2) / 2));
    if (intensidade <= 0 || this.rastro.length === 0) {
      return;
    }

    const total = this.rastro.length;
    for (let i = 0; i < total; i++) {
      const pos = this.rastro[i];
      const progresso = (i + 1) / total;
      canvasCtx.globalAlpha = progresso * (0.3 + intensidade * 0.5);
      canvasCtx.fillStyle = pos.cor;
      canvasCtx.beginPath();
      canvasCtx.arc(
        pos.x,
        pos.y,
        this.r * (0.4 + progresso * 0.6),
        0,
        2 * Math.PI
      );
      canvasCtx.fill();
    }
    canvasCtx.globalAlpha = 1;
  },
  _movimento: function () {
    this._registrarRastro();
    this.x += this.direcao.x * this.velocidade;
    this.y += this.direcao.y * this.velocidade;
  },
  draw: function (atualizar = true) {
    this._drawRastro();

    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.beginPath();
    canvasCtx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    canvasCtx.fill();

    if (!atualizar) return;

    this._calcularColisao();
    if (!partida.estaJogando()) return;
    this._movimento();
  },
};

export { bola };
