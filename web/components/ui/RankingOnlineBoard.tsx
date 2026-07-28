"use client";

import { useEffect, useState } from "react";
import { buscarRankingOnline } from "@/lib/onlineRanking";
import type { ResultadoRanking } from "@/lib/ranking";

type EstadoBusca = "carregando" | "pronto" | "erro";

export default function RankingOnlineBoard() {
  const [ranking, setRanking] = useState<ResultadoRanking[]>([]);
  const [estado, setEstado] = useState<EstadoBusca>("carregando");

  useEffect(() => {
    let cancelado = false;
    buscarRankingOnline()
      .then((dados) => {
        if (cancelado) return;
        setRanking(dados);
        setEstado("pronto");
      })
      .catch(() => {
        if (!cancelado) setEstado("erro");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="ranking">
      <h2>TOP 5 ONLINE</h2>
      {estado === "carregando" && <p className="ranking-vazio">Carregando…</p>}
      {estado === "erro" && (
        <p className="ranking-vazio">Não foi possível carregar o ranking online.</p>
      )}
      {estado === "pronto" && ranking.length === 0 && (
        <p className="ranking-vazio">Ninguém jogou online ainda. Seja o primeiro!</p>
      )}
      {estado === "pronto" && ranking.length > 0 && (
        <ul className="ranking-lista">
          {ranking.map((resultado, indice) => (
            <li
              className="ranking-item"
              key={`${resultado.nome}-${resultado.criadoEm}`}
            >
              <span>
                {indice + 1}. {resultado.nome}
              </span>
              <span>
                {resultado.golsFeitos}–{resultado.golsSofridos}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
