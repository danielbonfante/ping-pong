import { campo } from "./classes/campo.js";
import { linha } from "./classes/linha.js";
import { raqueteEsquerda } from "./classes/raqueteEsquerda.js";
import { raqueteDireita } from "./classes/raqueteDireita.js";
import { bola } from "./classes/bola.js";
import { placar } from "./classes/placar.js";
import { canvasEl, canvasCtx } from "./classes/constsGlobais.js";

function setup() {
  canvasEl.width = canvasCtx.width = campo.w;
  canvasEl.height = canvasCtx.height = campo.h;
}

function draw() {
  campo.draw();
  linha.draw();
  raqueteEsquerda.draw();
  raqueteDireita.draw();
  placar.draw();
  bola.draw();
}

window.animateFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    }
  );
})();

function main() {
  animateFrame(main);
  draw();
}

setup();
main();
