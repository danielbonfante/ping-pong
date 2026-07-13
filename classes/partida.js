const partida = {
  estado: "aguardando",
  aoEncerrar: null,
  iniciar: function () {
    this.estado = "jogando";
  },
  pausar: function () {
    if (this.estado === "jogando") this.estado = "pausada";
  },
  retomar: function () {
    if (this.estado === "pausada") this.estado = "jogando";
  },
  encerrar: function () {
    if (this.estado !== "jogando") return;
    this.estado = "encerrada";
    this.aoEncerrar?.();
  },
  estaJogando: function () {
    return this.estado === "jogando";
  },
  estaPausada: function () {
    return this.estado === "pausada";
  },
};

export { partida };
