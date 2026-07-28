"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MotorJogo } from "./GameCanvas";
import { avancarSimulacao, criarEstadoInicial, type ModoPartida } from "./simulacao";

export type ResultadoPartida = {
  vencedor: "esquerda" | "direita";
  golsEsquerda: number;
  golsDireita: number;
};

interface UseLocalSimulationArgs {
  modo: ModoPartida;
  nomeEsquerda: string;
  nomeDireita: string;
  onFimDeJogo: (resultado: ResultadoPartida) => void;
}

/**
 * Roda a física do jogo inteiramente no cliente — usada pelos modos
 * "bot" (lado direito = IA) e "local" (lado direito = segundo teclado).
 * Produz o mesmo formato de estado que o modo online vai consumir a
 * partir do WebSocket, então o GameCanvas não precisa distinguir a fonte.
 */
export function useLocalSimulation({
  modo,
  nomeEsquerda,
  nomeDireita,
  onFimDeJogo,
}: UseLocalSimulationArgs): MotorJogo {
  const larguraInicial = typeof window !== "undefined" ? window.innerWidth : 1280;
  const alturaInicial = typeof window !== "undefined" ? window.innerHeight : 720;
  const estadoRef = useRef(
    criarEstadoInicial(nomeEsquerda, nomeDireita, larguraInicial, alturaInicial)
  );
  const ponteiroYRef = useRef(alturaInicial / 2);
  const teclasRef = useRef<Set<string>>(new Set());
  const fimNotificadoRef = useRef(false);
  const onFimRef = useRef(onFimDeJogo);

  useEffect(() => {
    onFimRef.current = onFimDeJogo;
  }, [onFimDeJogo]);

  useEffect(() => {
    function aoKeyDown(evento: KeyboardEvent) {
      teclasRef.current.add(evento.code);
      if (modo === "local" && (evento.code === "ArrowUp" || evento.code === "ArrowDown")) {
        evento.preventDefault();
      }
    }
    function aoKeyUp(evento: KeyboardEvent) {
      teclasRef.current.delete(evento.code);
    }
    function aoPerderFoco() {
      teclasRef.current.clear();
    }

    window.addEventListener("keydown", aoKeyDown);
    window.addEventListener("keyup", aoKeyUp);
    window.addEventListener("blur", aoPerderFoco);
    return () => {
      window.removeEventListener("keydown", aoKeyDown);
      window.removeEventListener("keyup", aoKeyUp);
      window.removeEventListener("blur", aoPerderFoco);
    };
  }, [modo]);

  const motor = useMemo<MotorJogo>(
    () => ({
      estadoRef,
      ajustarCampo: (largura: number, altura: number) => {
        const estado = estadoRef.current;
        estado.campoW = largura;
        estado.campoH = altura;
      },
      aoMoverPonteiro: (y: number) => {
        ponteiroYRef.current = y;
      },
      step: () => {
        const estado = estadoRef.current;
        avancarSimulacao(estado, {
          modo,
          teclas: teclasRef.current,
          ponteiroY: ponteiroYRef.current,
        });
        if (estado.vencedor && !fimNotificadoRef.current) {
          fimNotificadoRef.current = true;
          onFimRef.current({
            vencedor: estado.vencedor,
            golsEsquerda: estado.golsEsquerda,
            golsDireita: estado.golsDireita,
          });
        }
      },
    }),
    [modo]
  );

  return motor;
}
