import { campo } from "./campo.js";
import { canvasCtx, gapX } from "./constsGlobais.js";
import { linha } from "./linha.js";
import { bola } from "./bola.js";

const raqueteDireita = {
  x: campo.w - linha.w - gapX,
  y: 0,
  w: linha.w,
  h: 200,
  velocidade: 1,
  corDaBarra: "#ffffff",
  _movimento: function () {
    if (this.y + this.h / 2 < bola.y + bola.r) {
      this.y += this.velocidade;
    } else {
      this.y -= this.velocidade;
    }
  },
  aumentarVelocidade: function () {
    this.velocidade += 0.1;
  },
  draw: function () {
    canvasCtx.fillStyle = this.corDaBarra;
    canvasCtx.fillRect(this.x, this.y, this.w, this.h);
    this._movimento();
  },
};

export { raqueteDireita };
