import { campo } from "./classes/campo.js";
import { linha } from "./classes/linha.js";
import { raqueteEsquerda } from "./classes/raqueteEsquerda.js";
import { raqueteDireita } from "./classes/raqueteDireita.js";
import { bola } from "./classes/bola.js";
import { placar } from "./classes/placar.js";
import { canvasEl, canvasCtx } from "./classes/constsGlobais.js";
import { partida } from "./classes/partida.js";
import { adicionarResultado, obterTop5 } from "./classes/ranking.js";

const nomesDoBot = [
  "Pelé", "Neymar", "Marta", "Romário", "Kaká", "Ronaldo", "Zico", "Rivaldo",
  "Mbappé", "Messi", "Ronaldinho", "Vinícius",
];

const telaInicial = document.querySelector("#tela-inicial");
const nomeInput = document.querySelector("#nome-jogador");
const botaoPlay = document.querySelector("#botao-play");
const mensagemPartida = document.querySelector("#mensagem-partida");
const rankingVazio = document.querySelector("#ranking-vazio");
const rankingLista = document.querySelector("#ranking-lista");
const botaoPausa = document.querySelector("#botao-pausa");
const menuPausa = document.querySelector("#menu-pausa");
const botaoRetomar = document.querySelector("#botao-retomar");

function setup() {
  canvasEl.width = canvasCtx.width = campo.w;
  canvasEl.height = canvasCtx.height = campo.h;
}

function nomeValido(nome) {
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{1,3}$/u.test(nome);
}

function atualizarPlay() {
  botaoPlay.disabled = !nomeValido(nomeInput.value);
}

function mostrarRanking() {
  const ranking = obterTop5();
  rankingLista.replaceChildren();
  rankingVazio.hidden = ranking.length > 0;

  ranking.forEach((resultado, indice) => {
    const item = document.createElement("li");
    item.className = "ranking-item";
    const nome = document.createElement("span");
    nome.textContent = `${indice + 1}. ${resultado.nome}`;
    const placarResultado = document.createElement("span");
    placarResultado.textContent = `${resultado.golsFeitos}–${resultado.golsSofridos}`;
    item.append(nome, placarResultado);
    rankingLista.append(item);
  });
}

function sortearNomeBot() {
  return nomesDoBot[Math.floor(Math.random() * nomesDoBot.length)];
}

function abrirTelaInicial(mensagem) {
  partida.estado = "aguardando";
  mensagemPartida.textContent = mensagem;
  mostrarRanking();
  telaInicial.classList.remove("oculta");
  atualizarPlay();
  nomeInput.focus();
}

function iniciarPartida() {
  const nome = nomeInput.value;
  if (!nomeValido(nome)) return;

  placar.reiniciar(nome, sortearNomeBot());
  raqueteEsquerda.reiniciar();
  raqueteDireita.reiniciar();
  bola.reiniciar();
  partida.iniciar();
  telaInicial.classList.add("oculta");
  botaoPausa.classList.remove("oculto");
}

function pausarJogo() {
  partida.pausar();
  if (!partida.estaPausada()) return;
  menuPausa.classList.remove("oculto");
  botaoPausa.classList.add("oculto");
}

function retomarJogo() {
  partida.retomar();
  menuPausa.classList.add("oculto");
  botaoPausa.classList.remove("oculto");
}

partida.aoEncerrar = function () {
  adicionarResultado(placar.nomeHumano, placar.humano, placar.computador);
  const venceu = placar.humano === 5;
  abrirTelaInicial(venceu ? "Você venceu! Primeiro a 5 gols." : "O bot venceu! Tente outra vez.");
  botaoPausa.classList.add("oculto");
};

nomeInput.addEventListener("input", () => {
  nomeInput.value = nomeInput.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/gu, "").slice(0, 3);
  atualizarPlay();
});
botaoPlay.addEventListener("click", iniciarPartida);
botaoPausa.addEventListener("click", pausarJogo);
botaoRetomar.addEventListener("click", retomarJogo);
nomeInput.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" && !botaoPlay.disabled) iniciarPartida();
});

function draw() {
  campo.draw();
  linha.draw();
  raqueteEsquerda.draw(partida.estaJogando());
  raqueteDireita.draw(partida.estaJogando());
  placar.draw();
  bola.draw(partida.estaJogando());
}

window.animateFrame = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 1000 / 60));

function main() {
  animateFrame(main);
  draw();
}

setup();
mostrarRanking();
main();
