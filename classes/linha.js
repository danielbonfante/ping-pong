import { campo } from "./campo.js";
import { canvasCtx } from "./constsGlobais.js";

const linha = {
  w: 15,
  h: window.innerHeight,
  draw: function () {
    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.fillRect(campo.w / 2 - this.w / 2, 0, this.w, campo.h);
  },
};

export { linha };
