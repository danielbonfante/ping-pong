import { campo } from "./campo.js";
import { canvasCtx, gapX } from "./constsGlobais.js";
import { raqueteDireita } from "./raqueteDireita.js";
import { raqueteEsquerda } from "./raqueteEsquerda.js";
import { placar } from "./placar.js";

const bola = {
  x: 0,
  y: 0,
  r: 20,
  velocidade: 2,
  direcao: { x: 1, y: 1 },
  _calcularColisao: function () {
    if (this.x > campo.w - this.r - raqueteDireita.w - gapX) {
      if (
        this.y + this.r > raqueteDireita.y &&
        this.y - this.r < raqueteDireita.y + raqueteDireita.h
      ) {
        this._reverteDirecaoX();
      } else {
        placar.pontoHumano();
        this._pontoFeito();
      }
    }

    if (this.x < this.r + raqueteEsquerda.w + gapX)
      if (
        this.y + this.r > raqueteEsquerda.y &&
        this.y - this.r < raqueteEsquerda.y + raqueteEsquerda.h
      ) {
        this._reverteDirecaoX();
      } else {
        placar.pontoComputador();
        this._pontoFeito();
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
    this._aumentarVelocidade();
  },
  _reverteDirecaoX: function () {
    this.direcao.x *= -1;
    this._aumentarVelocidade();
  },
  _aumentarVelocidade: function () {
    this.velocidade += 0.25;
    raqueteDireita.velocidade += 0.025;
  },
  _pontoFeito: function () {
    this.x = campo.w / 2;
    this.y = campo.h / 2;
    this.velocidade = 2;
  },
  _movimento: function () {
    this.x += this.direcao.x * this.velocidade;
    this.y += this.direcao.y * this.velocidade;
  },
  draw: function () {
    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.beginPath();
    canvasCtx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    canvasCtx.fill();

    this._calcularColisao();
    this._movimento();
  },
};

export { bola };
