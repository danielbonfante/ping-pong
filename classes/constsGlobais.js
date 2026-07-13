const canvasEl = document.querySelector("canvas"),
  canvasCtx = canvasEl.getContext("2d");

const gapX = 15;
const zonaPotenciaRatio = 0.3;
const deltaVelocidade = 0.4;
const velocidadeMinima = 1;
const limiarRastro = 3;
const corZonaPotencia = "#FFD700";
const coresRastro = [
  "#FF4444",
  "#44FF44",
  "#4488FF",
  "#FF44FF",
  "#FFAA00",
  "#00FFCC",
];
const mouse = { x: 0, y: 0 };

canvasEl.addEventListener("mousemove", function (e) {
  mouse.x = e.pageX;
  mouse.y = e.pageY;
});

export {
  canvasEl,
  canvasCtx,
  gapX,
  zonaPotenciaRatio,
  deltaVelocidade,
  velocidadeMinima,
  limiarRastro,
  corZonaPotencia,
  coresRastro,
  mouse,
};
