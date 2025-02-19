import { canvasCtx, mouse, gapX } from "./constsGlobais.js";
import { linha } from "./linha.js";

const raqueteEsquerda = {
  x: gapX,
  y: 0,
  w: linha.w,
  h: 200,
  corDaBarra: "#ffffff",
  _movimento: function () {
    this.y = mouse.y - this.h / 2;
  },
  draw: function () {
    canvasCtx.fillStyle = this.corDaBarra;
    canvasCtx.fillRect(this.x, this.y, this.w, this.h);

    this._movimento();
  },
};

export { raqueteEsquerda };
