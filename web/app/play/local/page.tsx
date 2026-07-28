"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/game/GameCanvas";
import { useLocalSimulation, type ResultadoPartida } from "@/components/game/useLocalSimulation";
import PainelJogo from "@/components/ui/PainelJogo";
import { nomeValido, normalizarNome } from "@/lib/playerName";

export default function PaginaLocal() {
  const [nomeP1, setNomeP1] = useState("");
  const [nomeP2, setNomeP2] = useState("");
  const [iniciado, setIniciado] = useState(false);

  const podeIniciar = nomeValido(nomeP1) && nomeValido(nomeP2);

  if (iniciado) {
    return <PartidaLocal nomeEsquerda={nomeP1} nomeDireita={nomeP2} />;
  }

  return (
    <main className="tela-inicial">
      <PainelJogo titulo="MULTIPLAYER LOCAL">
        <p className="subtitulo">P1: W/S &bull; P2: &uarr;/&darr;</p>
        <label htmlFor="nome-player-1">Player 1 (até 3 letras)</label>
        <input
          id="nome-player-1"
          type="text"
          maxLength={3}
          autoComplete="off"
          inputMode="text"
          value={nomeP1}
          onChange={(evento) => setNomeP1(normalizarNome(evento.target.value))}
        />
        <label htmlFor="nome-player-2">Player 2 (até 3 letras)</label>
        <input
          id="nome-player-2"
          type="text"
          maxLength={3}
          autoComplete="off"
          inputMode="text"
          value={nomeP2}
          onChange={(evento) => setNomeP2(normalizarNome(evento.target.value))}
          onKeyDown={(evento) => {
            if (evento.key === "Enter" && podeIniciar) setIniciado(true);
          }}
        />
        <div className="acoes-modal">
          <button type="button" disabled={!podeIniciar} onClick={() => setIniciado(true)}>
            INICIAR PARTIDA
          </button>
          <Link href="/" className="botao botao-secundario">
            VOLTAR
          </Link>
        </div>
      </PainelJogo>
    </main>
  );
}

function PartidaLocal({
  nomeEsquerda,
  nomeDireita,
}: {
  nomeEsquerda: string;
  nomeDireita: string;
}) {
  const router = useRouter();
  const [pausado, setPausado] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);

  const motor = useLocalSimulation({
    modo: "local",
    nomeEsquerda,
    nomeDireita,
    onFimDeJogo: setResultado,
  });

  const nomeVencedor = resultado?.vencedor === "esquerda" ? nomeEsquerda : nomeDireita;

  return (
    <>
      <GameCanvas motor={motor} ativo={!pausado && !resultado} />

      {!resultado && (
        <button
          type="button"
          className="botao-pausa"
          onClick={() => setPausado((valor) => !valor)}
        >
          {pausado ? "CONTINUAR" : "PAUSE"}
        </button>
      )}

      {pausado && !resultado && (
        <div className="tela-inicial">
          <div className="painel">
            <h1>PAUSE</h1>
            <p className="subtitulo">A partida está esperando por você.</p>
            <div className="acoes-modal">
              <button type="button" onClick={() => setPausado(false)}>
                RETORNAR AO JOGO
              </button>
            </div>
          </div>
        </div>
      )}

      {resultado && (
        <div className="tela-inicial">
          <div className="painel">
            <h1>{nomeVencedor} VENCEU!</h1>
            <p className="subtitulo">
              {resultado.golsEsquerda} – {resultado.golsDireita}
            </p>
            <div className="acoes-modal">
              <button type="button" onClick={() => router.push("/")}>
                VOLTAR AO MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
