const canvasEl = document.querySelector("canvas"),
  canvasCtx = canvasEl.getContext("2d");

const gapX = 15;
const mouse = { x: 0, y: 0 };

canvasEl.addEventListener("mousemove", function (e) {
  mouse.x = e.pageX;
  mouse.y = e.pageY;
});

export { canvasEl, canvasCtx, gapX, mouse };
