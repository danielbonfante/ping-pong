import { campo } from "./campo.js";
import {
  canvasCtx,
  gapX,
  zonaPotenciaRatio,
  corZonaPotencia,
} from "./constsGlobais.js";
import { linha } from "./linha.js";
import { bola } from "./bola.js";

const raqueteDireita = {
  x: campo.w - linha.w - gapX,
  y: 0,
  w: linha.w,
  h: 200,
  velocidade: 1,
  corDaBarra: "#ffffff",
  _calcularAlvo: function () {
    if (bola.direcao.x <= 0) {
      return campo.h / 2;
    }

    const limiteX = campo.w - this.w - gapX - bola.r;
    const distancia = limiteX - bola.x;

    if (distancia <= 0) {
      return bola.y;
    }

    const tempo = distancia / bola.velocidade;
    return bola.y + bola.direcao.y * bola.velocidade * tempo;
  },
  _movimento: function () {
    const centroRaquete = this.y + this.h / 2;
    const alvoY = this._calcularAlvo();
    const diferenca = alvoY - centroRaquete;
    const velEfetiva = Math.min(this.velocidade, bola.velocidade * 0.85);

    if (Math.abs(diferenca) > velEfetiva) {
      this.y += Math.sign(diferenca) * velEfetiva;
    } else {
      this.y += diferenca;
    }

    this.y = Math.max(0, Math.min(campo.h - this.h, this.y));
  },
  aumentarVelocidade: function () {
    this.velocidade += 0.1;
  },
  reiniciar: function () {
    this.y = campo.h / 2 - this.h / 2;
    this.h = 200;
    this.velocidade = 1;
    this.corDaBarra = "#ffffff";
  },
  _drawZonaPotencia: function () {
    const centroY = this.y + this.h / 2;
    const zonaH = this.h * zonaPotenciaRatio;
    canvasCtx.fillStyle = corZonaPotencia;
    canvasCtx.fillRect(this.x, centroY - zonaH / 2, this.w, zonaH);
  },
  draw: function (atualizar = true) {
    canvasCtx.fillStyle = this.corDaBarra;
    canvasCtx.fillRect(this.x, this.y, this.w, this.h);
    this._drawZonaPotencia();
    if (atualizar) this._movimento();
  },
};

export { raqueteDireita };
