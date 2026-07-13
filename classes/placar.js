import { campo } from "./campo.js";
import { canvasCtx } from "./constsGlobais.js";
import { bola } from "./bola.js";
import { raqueteDireita } from "./raqueteDireita.js";
import { raqueteEsquerda } from "./raqueteEsquerda.js";
import { partida } from "./partida.js";

const placar = {
  humano: 0,
  computador: 0,
  nomeHumano: "JOG",
  nomeComputador: "BOT",
  pontoHumano: function () {
    this.humano++;
    raqueteDireita.aumentarVelocidade();
    if (this.humano > 0 && this.humano % 5 === 0) {
      raqueteDireita.aumentarVelocidade();
      raqueteDireita.h += 30;
      raqueteDireita.corDaBarra = `#${Math.floor(
        Math.random() * 16777215
      ).toString(16)}`;
    }
    this._verificarFim();
  },
  pontoComputador: function () {
    this.computador++;
    raqueteDireita.velocidade += 0.1;
    if (this.computador > 0 && this.computador % 5 === 0) {
      raqueteEsquerda.h += 30;
      raqueteEsquerda.corDaBarra = `#${Math.floor(
        Math.random() * 16777215
      ).toString(16)}`;
    }
    if (this.computador > 0 && this.computador % 10 === 0) {
      raqueteDireita.velocidade = 0.1;
    }
    this._verificarFim();
  },
  _verificarFim: function () {
    if (this.humano >= 5 || this.computador >= 5) {
      partida.encerrar();
    }
  },
  reiniciar: function (nomeHumano, nomeComputador) {
    this.humano = 0;
    this.computador = 0;
    this.nomeHumano = nomeHumano;
    this.nomeComputador = nomeComputador;
  },
  draw: function () {
    canvasCtx.font = "bold 72px Arial";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "top";
    canvasCtx.fillStyle = "#01341D";
    canvasCtx.font = "bold 20px Arial";
    canvasCtx.fillText(this.nomeHumano, campo.w / 4, 22);
    canvasCtx.fillText(this.nomeComputador, campo.w / 4 + campo.w / 2, 22);
    canvasCtx.font = "bold 72px Arial";
    canvasCtx.fillText(this.humano, campo.w / 4, 50);
    canvasCtx.fillText(this.computador, campo.w / 4 + campo.w / 2, 50);
    canvasCtx.font = "bold 24px Arial";
    canvasCtx.fillText(
      "Velocidade da bola: " + bola.velocidade.toFixed(2),
      campo.w / 4,
      campo.h - 50
    );
    canvasCtx.fillText(
      "Velocidade da raquete: " + raqueteDireita.velocidade.toFixed(2),
      campo.w / 4 + campo.w / 2,
      campo.h - 50
    );
  },
};

export { placar };
