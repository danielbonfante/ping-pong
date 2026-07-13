import {
  canvasCtx,
  mouse,
  gapX,
  zonaPotenciaRatio,
  corZonaPotencia,
} from "./constsGlobais.js";
import { linha } from "./linha.js";
import { campo } from "./campo.js";

const raqueteEsquerda = {
  x: gapX,
  y: 0,
  w: linha.w,
  h: 200,
  corDaBarra: "#ffffff",
  _movimento: function () {
    this.y = Math.max(0, Math.min(campo.h - this.h, mouse.y - this.h / 2));
  },
  reiniciar: function () {
    this.y = campo.h / 2 - this.h / 2;
    this.h = 200;
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

export { raqueteEsquerda };
