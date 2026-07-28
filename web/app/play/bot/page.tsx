"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/game/GameCanvas";
import { useLocalSimulation, type ResultadoPartida } from "@/components/game/useLocalSimulation";
import {
  getNomeJogadorServerSnapshot,
  getNomeJogadorSnapshot,
  nomeValido,
  subscribeNomeJogador,
} from "@/lib/playerName";
import { adicionarResultado } from "@/lib/ranking";

const NOMES_BOT = [
  "Pelé",
  "Neymar",
  "Marta",
  "Romário",
  "Kaká",
  "Ronaldo",
  "Zico",
  "Rivaldo",
  "Mbappé",
  "Messi",
  "Ronaldinho",
  "Vinícius",
];

function sortearNomeBot(): string {
  return NOMES_BOT[Math.floor(Math.random() * NOMES_BOT.length)];
}

/** Lê o nome do jogador (localStorage) e redireciona se ainda não houver um válido. */
export default function PaginaContraBot() {
  const router = useRouter();
  const nomeJogador = useSyncExternalStore(
    subscribeNomeJogador,
    getNomeJogadorSnapshot,
    getNomeJogadorServerSnapshot
  );

  useEffect(() => {
    if (!nomeValido(nomeJogador)) router.replace("/");
  }, [nomeJogador, router]);

  if (!nomeValido(nomeJogador)) return null;

  return <PartidaContraBot nomeJogador={nomeJogador} />;
}

function PartidaContraBot({ nomeJogador }: { nomeJogador: string }) {
  const router = useRouter();
  const [nomeBot] = useState(() => sortearNomeBot());
  const [pausado, setPausado] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);

  function aoFimDeJogo(resultadoFinal: ResultadoPartida) {
    setResultado(resultadoFinal);
    adicionarResultado(nomeJogador, resultadoFinal.golsEsquerda, resultadoFinal.golsDireita);
  }

  const motor = useLocalSimulation({
    modo: "bot",
    nomeEsquerda: nomeJogador,
    nomeDireita: nomeBot,
    onFimDeJogo: aoFimDeJogo,
  });

  const venceu = resultado?.vencedor === "esquerda";

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
            <h1>{venceu ? "VOCÊ VENCEU!" : "O BOT VENCEU"}</h1>
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
