"use client";

import { useSyncExternalStore } from "react";
import {
  getRankingServerSnapshot,
  getRankingSnapshot,
  subscribeRanking,
} from "@/lib/ranking";

export default function RankingBoard() {
  const ranking = useSyncExternalStore(
    subscribeRanking,
    getRankingSnapshot,
    getRankingServerSnapshot
  );

  return (
    <div className="ranking">
      <h2>TOP 5</h2>
      {ranking.length === 0 ? (
        <p className="ranking-vazio">Ninguém jogou ainda. Seja o primeiro!</p>
      ) : (
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
